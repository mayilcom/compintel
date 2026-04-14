import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type Plan } from '@/lib/utils'

export const metadata = { title: 'Channels — Settings' }

type ChannelStatus = 'connected' | 'disconnected' | 'auto'

interface ChannelDef {
  id:           string
  name:         string
  description:  string
  oauthKey:     string | null   // key in accounts.oauth_tokens — null = no OAuth needed
  autoLabel?:   string          // label for auto-enabled channels
  tier:         'all' | 'growth' | 'agency'
}

const CHANNEL_DEFS: ChannelDef[] = [
  { id: 'meta_ads',   name: 'Meta Ads Library',               description: 'Active ads, creative formats, and campaign dates across Facebook and Instagram.', oauthKey: 'meta',    tier: 'all'    },
  { id: 'instagram',  name: 'Instagram',                       description: 'Organic post frequency, engagement rate, and story activity.',                     oauthKey: 'instagram', tier: 'all'  },
  { id: 'google_ads', name: 'Google Ads',                      description: 'Ad spend, impression share, and search term data for competitors.',                oauthKey: 'google',  tier: 'all'    },
  { id: 'linkedin',   name: 'LinkedIn',                        description: 'Company page posts, follower growth, and job postings as a signal.',               oauthKey: 'linkedin', tier: 'growth' },
  { id: 'youtube',    name: 'YouTube',                         description: 'Video upload cadence, view velocity, and paid promotion detection.',               oauthKey: 'google',  tier: 'growth' },
  { id: 'twitter',    name: 'X (Twitter)',                     description: 'Brand mentions, campaign hashtags, and influencer activity.',                      oauthKey: 'twitter', tier: 'agency' },
  { id: 'amazon',     name: 'Amazon / Quick Commerce',         description: 'Product ratings, review volume, and pricing across Blinkit, Swiggy Instamart.',   oauthKey: null, autoLabel: 'Tracked via ASIN list', tier: 'all' },
  { id: 'news',       name: 'News & PR',                       description: 'Press coverage, funding announcements, and product launches via RSS + Google News.', oauthKey: null, autoLabel: 'Auto-enabled for all brands', tier: 'all' },
  { id: 'google_search', name: 'Google Search Trends',         description: 'Search interest, trending queries, and brand mention velocity.',                   oauthKey: null, autoLabel: 'Auto-enabled via public data', tier: 'all' },
]

const STATUS_CONFIG: Record<ChannelStatus, { label: string; dot: string }> = {
  connected:    { label: 'Connected',    dot: 'bg-opportunity' },
  disconnected: { label: 'Disconnected', dot: 'bg-border'      },
  auto:         { label: 'Active',       dot: 'bg-opportunity' },
}

const TIER_LABELS: Record<string, string> = {
  growth: 'Growth+',
  agency: 'Agency',
}

export default async function ChannelsSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServiceClient()

  const { data: account } = await db
    .from('accounts')
    .select('plan, oauth_tokens')
    .eq('clerk_user_id', userId)
    .single()

  if (!account) redirect('/onboarding/brand')

  const acc = account as { plan: string; oauth_tokens: Record<string, unknown> | null }
  const oauthTokens = acc.oauth_tokens ?? {}
  const planLimits = PLAN_LIMITS[acc.plan as Plan] ?? PLAN_LIMITS.trial

  function getStatus(ch: ChannelDef): ChannelStatus {
    if (ch.oauthKey === null) return 'auto'
    return oauthTokens[ch.oauthKey] ? 'connected' : 'disconnected'
  }

  function isLocked(ch: ChannelDef): boolean {
    if (ch.tier === 'growth' && !planLimits.v2Channels) return true
    if (ch.tier === 'agency') return acc.plan !== 'agency' && acc.plan !== 'enterprise'
    return false
  }

  const activeCount = CHANNEL_DEFS.filter(ch => {
    const s = getStatus(ch)
    return (s === 'connected' || s === 'auto') && !isLocked(ch)
  }).length

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Connected channels</h1>
        <p className="mt-1 text-[13px] text-muted">
          Mayil monitors these sources to detect competitor activity. Connect channels for richer signals.
        </p>
      </div>

      {/* Status summary */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{activeCount} of {CHANNEL_DEFS.length} channels active</p>
            <p className="text-[11px] text-muted mt-0.5">More channels = more precise signals in your brief.</p>
          </div>
          <div className="flex gap-1">
            {CHANNEL_DEFS.map((ch) => {
              const s = getStatus(ch)
              return (
                <div
                  key={ch.id}
                  title={ch.name}
                  className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].dot} ${isLocked(ch) ? 'opacity-30' : ''}`}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Channel list */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-border">
            <p className="label-section">Channels</p>
          </div>
          {CHANNEL_DEFS.map((ch) => {
            const status  = getStatus(ch)
            const locked  = isLocked(ch)
            const cfg     = STATUS_CONFIG[status]
            return (
              <div
                key={ch.id}
                className={`flex items-start justify-between px-5 py-4 border-b border-border last:border-0 ${locked ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-medium text-ink">{ch.name}</p>
                    {ch.tier !== 'all' && (
                      <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                        {TIER_LABELS[ch.tier]}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">{ch.description}</p>
                  {ch.autoLabel && (
                    <p className="text-[11px] text-ink mt-1 font-mono">{ch.autoLabel}</p>
                  )}
                  {status === 'connected' && ch.oauthKey && (
                    <p className="text-[11px] text-opportunity mt-1">Connected</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className="text-[11px] text-muted">{cfg.label}</span>
                  </div>
                  {locked ? (
                    <a href={`/upgrade?reason=channels`}>
                      <Button variant="outline" size="sm" className="ml-2 h-7 text-[11px]">Upgrade</Button>
                    </a>
                  ) : ch.oauthKey !== null ? (
                    status === 'connected' ? (
                      <button className="ml-2 text-[11px] text-muted hover:text-threat transition-colors">
                        Disconnect
                      </button>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-2 h-7 text-[11px]" disabled>
                        Connect
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted px-1">
        OAuth channel connections are read-only. We never post on your behalf.
        Connect buttons will be enabled as OAuth flows are rolled out.{' '}
        <a href="/app/settings/subscription" className="text-gold-dark hover:underline">
          View plan limits →
        </a>
      </p>
    </div>
  )
}
