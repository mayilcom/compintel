import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/complete
 * Marks the account's onboarding as complete.
 * Called from the /onboarding/done page on mount.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  await db
    .from('accounts')
    .update({
      onboarding_completed_at:    new Date().toISOString(),
      ninjapear_enrichment_status: 'pending',   // triggers background enrichment worker
    })
    .eq('clerk_user_id', userId)
    .is('onboarding_completed_at', null) // only write once

  return NextResponse.json({ ok: true })
}
