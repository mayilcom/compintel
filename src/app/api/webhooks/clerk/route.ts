import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createServiceClient } from '@/lib/supabase/server'

// Clerk sends webhooks signed with Svix.
// https://clerk.com/docs/integrations/webhooks/overview

interface ClerkUserCreatedEvent {
  type: 'user.created'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
  }
}

interface ClerkUserDeletedEvent {
  type: 'user.deleted'
  data: { id: string; deleted: boolean }
}

interface ClerkOrgMembershipCreatedEvent {
  type: 'organizationMembership.created'
  data: {
    id: string
    organization: { id: string }
    public_user_data: { user_id: string }
  }
}

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | ClerkUserDeletedEvent
  | ClerkOrgMembershipCreatedEvent
  | { type: string; data: unknown }


export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  const svixId        = req.headers.get('svix-id')        ?? ''
  const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
  const svixSignature = req.headers.get('svix-signature') ?? ''

  const wh = new Webhook(webhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(rawBody, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.warn('[clerk-webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'user.created': {
        const { id, email_addresses, primary_email_address_id } = (event as ClerkUserCreatedEvent).data
        const primaryEmail = email_addresses.find(
          (e) => e.id === primary_email_address_id
        )?.email_address

        if (!primaryEmail) {
          console.error('[clerk-webhook] user.created — no primary email for', id)
          break
        }

        // Create the account row. trial_ends_at = 14 days from now.
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        const { error } = await supabase.from('accounts').insert({
          clerk_user_id: id,
          email: primaryEmail,
          plan: 'trial',
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        })

        if (error) {
          // Unique constraint violation = account already exists (replay-safe)
          if (error.code === '23505') break
          throw error
        }

        // Also add the account owner as a recipient (default: full brief)
        const { data: account } = await supabase
          .from('accounts')
          .select('account_id')
          .eq('clerk_user_id', id)
          .single()

        if (account) {
          await supabase.from('recipients').insert({
            account_id: account.account_id,
            name: primaryEmail.split('@')[0],
            email: primaryEmail,
            brief_variant: 'full',
          })
        }
        break
      }

      case 'user.deleted': {
        const { id } = (event as ClerkUserDeletedEvent).data
        // Soft-delete: mark account as canceled; hard delete runs at day 118 (PRD §14)
        await supabase
          .from('accounts')
          .update({ subscription_status: 'canceled' })
          .eq('clerk_user_id', id)
        break
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data } =
          (event as ClerkOrgMembershipCreatedEvent).data
        // Link the Clerk org ID to the account for multi-seat support
        await supabase
          .from('accounts')
          .update({ clerk_org_id: organization.id })
          .eq('clerk_user_id', public_user_data.user_id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[clerk-webhook] handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
