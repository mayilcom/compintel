import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/settings/team
 * Returns current members. If clerk_org_id exists on the account,
 * fetches org membership list from Clerk. Otherwise returns just the owner.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, db] = await Promise.all([currentUser(), Promise.resolve(createServiceClient())])

  const { data: account } = await db
    .from('accounts')
    .select('account_id, plan, clerk_org_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const acc = account as { account_id: string; plan: string; clerk_org_id: string | null }

  const owner = {
    id:       userId,
    name:     [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
    email:    user?.emailAddresses[0]?.emailAddress ?? '',
    role:     'Owner',
    joinedAt: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '',
  }

  let members = [owner]

  if (acc.clerk_org_id) {
    try {
      const client = await clerkClient()
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: acc.clerk_org_id,
      })
      members = memberships.data.map((m) => ({
        id:       m.publicUserData?.userId ?? '',
        name:     [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ')
                  || m.publicUserData?.identifier ?? 'Unknown',
        email:    m.publicUserData?.identifier ?? '',
        role:     m.role === 'org:admin' ? 'Admin' : 'Member',
        joinedAt: new Date(m.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      }))
    } catch {
      // Fall back to owner only if Clerk API fails
    }
  }

  return NextResponse.json({ members, plan: acc.plan, has_org: !!acc.clerk_org_id })
}

/**
 * POST /api/settings/team
 * Body: { email }
 * Creates a Clerk org if none exists, then sends an org invitation.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select('account_id, plan, clerk_org_id, company_name')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const acc = account as {
    account_id:   string
    plan:         string
    clerk_org_id: string | null
    company_name: string | null
  }

  const client = await clerkClient()
  let orgId = acc.clerk_org_id

  // Create an org if this account doesn't have one yet
  if (!orgId) {
    const org = await client.organizations.createOrganization({
      name:      acc.company_name ?? 'My Workspace',
      createdBy: userId,
    })
    orgId = org.id
    await db
      .from('accounts')
      .update({ clerk_org_id: orgId })
      .eq('account_id', acc.account_id)
  }

  await client.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress:   email.trim().toLowerCase(),
    role:           'org:member',
    inviterUserId:  userId,
    redirectUrl:    `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sign-up`,
  })

  return NextResponse.json({ ok: true })
}
