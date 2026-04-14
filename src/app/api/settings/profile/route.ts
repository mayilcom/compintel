import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/settings/profile
 * Returns Clerk display fields merged with account-level profile data.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, db] = await Promise.all([currentUser(), Promise.resolve(createServiceClient())])

  const { data: account, error } = await db
    .from('accounts')
    .select('email, company_name, role, whatsapp_number')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const a = account as {
    email: string
    company_name: string | null
    role:         string | null
    whatsapp_number: string | null
  }

  return NextResponse.json({
    first_name:      user?.firstName ?? '',
    last_name:       user?.lastName  ?? '',
    email:           user?.emailAddresses[0]?.emailAddress ?? a.email,
    company_name:    a.company_name,
    role:            a.role,
    whatsapp_number: a.whatsapp_number,
  })
}

/**
 * PATCH /api/settings/profile
 * Updates company_name, role, and/or whatsapp_number on the accounts row.
 */
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed: Record<string, unknown> = {}
  if ('company_name'    in body) allowed.company_name    = body.company_name    ?? null
  if ('role'            in body) allowed.role            = body.role            ?? null
  if ('whatsapp_number' in body) allowed.whatsapp_number = body.whatsapp_number ?? null

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('accounts')
    .update(allowed)
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
