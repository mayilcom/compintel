import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * DELETE /api/settings/recipients/[id]
 * Soft-deletes a recipient (sets active = false).
 * Only removes recipients belonging to the current account.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const db = createServiceClient()

  const { data: account, error: accErr } = await db
    .from('accounts')
    .select('account_id')
    .eq('clerk_user_id', userId)
    .single()

  if (accErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const accountId = (account as { account_id: string }).account_id

  const { error } = await db
    .from('recipients')
    .update({ active: false })
    .eq('recipient_id', id)
    .eq('account_id', accountId) // ownership check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
