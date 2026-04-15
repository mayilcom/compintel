export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { WeeklyStatusCard } from '@/components/dashboard/weekly-status-card'
import { CompetitorTable } from '@/components/dashboard/competitor-table'
import type { CompetitorRow } from '@/components/dashboard/competitor-table'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

/** Monday of the current ISO week (UTC) */
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function prevWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)}–${end.toLocaleDateString('en-IN', { day: 'numeric', year: 'numeric' })}`
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db  = createServiceClient()
  const weekStart = currentWeekStart()
  const prevWeek  = prevWeekStart(weekStart)

  // ── Account ──────────────────────────────────────────────────
  const { data: account } = await db
    .from('accounts')
    .select('account_id, plan, trial_ends_at, onboarding_completed_at')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')

  const accountId = (account as Record<string, unknown>).account_id as string

  // ── This week's brief ────────────────────────────────────────
  const { data: brief } = await db
    .from('briefs')
    .select('brief_id, status, issue_number, signal_ids, sent_at, is_baseline')
    .eq('account_id', accountId)
    .eq('week_start', weekStart)
    .maybeSingle()

  const b = brief as Record<string, unknown> | null

  // ── Signal count for this week ───────────────────────────────
  const { count: signalCount } = await db
    .from('signals')
    .select('signal_id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('week_start', weekStart)
    .eq('selected_for_brief', true)

  // ── Check if first brief ─────────────────────────────────────
  const { count: sentBriefCount } = await db
    .from('briefs')
    .select('brief_id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('status', 'sent')

  const isFirstBrief = (sentBriefCount ?? 0) === 0

  // Expected first brief date: next Sunday after account creation
  // Approximate by finding the upcoming Sunday from today
  const nextSunday = new Date()
  const daysUntilSunday = (7 - nextSunday.getUTCDay()) % 7 || 7
  nextSunday.setUTCDate(nextSunday.getUTCDate() + daysUntilSunday)
  const firstBriefDue = nextSunday.toISOString().slice(0, 10)

  // ── Competitor brands + snapshots ────────────────────────────
  const { data: brands } = await db
    .from('brands')
    .select('brand_id, brand_name, channels')
    .eq('account_id', accountId)
    .eq('is_client', false)
    .eq('is_paused', false)
    .order('brand_name')

  const brandRows = (brands ?? []) as Array<Record<string, unknown>>
  const brandIds  = brandRows.map(b => b.brand_id as string)

  // Current-week snapshots
  const { data: snapshots } = brandIds.length > 0
    ? await db
        .from('snapshots')
        .select('brand_id, channel, metrics')
        .in('brand_id', brandIds)
        .eq('week_start', weekStart)
        .in('channel', ['instagram', 'meta_ads', 'amazon'])
    : { data: [] }

  // Prior-week amazon snapshots for rating delta
  const { data: prevSnapshots } = brandIds.length > 0
    ? await db
        .from('snapshots')
        .select('brand_id, metrics')
        .in('brand_id', brandIds)
        .eq('week_start', prevWeek)
        .eq('channel', 'amazon')
    : { data: [] }

  // Index snapshots by brand_id + channel
  type Snap = { brand_id: string; channel: string; metrics: Record<string, unknown> }
  const snapMap = new Map<string, Snap>()
  for (const s of (snapshots ?? []) as Snap[]) {
    snapMap.set(`${s.brand_id}:${s.channel}`, s)
  }

  type PrevSnap = { brand_id: string; metrics: Record<string, unknown> }
  const prevAmazonMap = new Map<string, PrevSnap>()
  for (const s of (prevSnapshots ?? []) as PrevSnap[]) {
    prevAmazonMap.set(s.brand_id, s)
  }

  // Build competitor rows for the table
  const competitors: CompetitorRow[] = brandRows.map(brand => {
    const id   = brand.brand_id as string
    const ig   = snapMap.get(`${id}:instagram`)
    const meta = snapMap.get(`${id}:meta_ads`)
    const amz  = snapMap.get(`${id}:amazon`)
    const prevAmz = prevAmazonMap.get(id)

    // instagram handle from brand.channels jsonb
    const channels = (brand.channels ?? {}) as Record<string, { handle?: string }>
    const igHandle = channels.instagram?.handle?.replace('@', '') ?? null

    return {
      brand_id:        id,
      brand_name:      brand.brand_name as string,
      instagram_handle: igHandle,
      follower_count:  (ig?.metrics.follower_count as number | null) ?? null,
      post_count_7d:   (ig?.metrics.post_count_7d  as number | null) ?? null,
      last_post_date:  (ig?.metrics.last_post_date as string | null) ?? null,
      active_ad_count: (meta?.metrics.active_ad_count as number | null) ?? null,
      new_ads_7d:      (meta?.metrics.new_ads_7d    as number | null) ?? null,
      avg_rating:      (amz?.metrics.avg_rating     as number | null) ?? null,
      prev_avg_rating: (prevAmz?.metrics.avg_rating  as number | null) ?? null,
    }
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Dashboard</h1>
          <p className="mt-1 text-[13px] text-muted">
            Week of {weekRangeLabel(weekStart)}
          </p>
        </div>
        <Link href="/app/briefs">
          <Button variant="outline" size="sm">View all briefs</Button>
        </Link>
      </div>

      {/* Weekly status card */}
      <WeeklyStatusCard
        briefStatus={b ? (b.status as 'pending' | 'assembled' | 'held' | 'sent' | 'failed') : null}
        briefId={b?.brief_id as string | null ?? null}
        issueNumber={b?.issue_number as number | null ?? null}
        signalCount={signalCount ?? 0}
        sentAt={b?.sent_at as string | null ?? null}
        isFirstBrief={isFirstBrief}
        firstBriefDue={firstBriefDue}
      />

      {/* Competitor snapshot table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="label-section">Competitor snapshot</p>
          <p className="text-xs text-muted">
            {snapshots && snapshots.length > 0
              ? `Updated week of ${weekRangeLabel(weekStart)}`
              : 'No data yet — collection runs Saturday 11pm IST'}
          </p>
        </div>
        <CompetitorTable competitors={competitors} />
      </div>
    </div>
  )
}
