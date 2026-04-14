import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Connect channels — Mayil' }

const CHANNELS = [
  {
    id: 'google',
    name: 'Google Search Console + YouTube',
    description: 'Exact keyword rankings, CTR, impressions. YouTube watch time and subscriber growth.',
    scopes: 'youtube.readonly, search-console.readonly',
    reviewRequired: false,
    available: true,
    icon: '🔍',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Real reach, saves, shares, story views, and audience demographics — all hidden from public.',
    scopes: 'instagram_basic, instagram_insights',
    reviewRequired: true,
    available: true,
    icon: '📸',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Own page impressions, reach, follower seniority, and industry breakdown.',
    scopes: 'r_organization_social, r_organization_followers',
    reviewRequired: true,
    available: true,
    icon: '💼',
  },
]

export default function OnboardingChannelsPage() {
  return (
    <div>
      <OnboardingProgress currentStep={3} />

      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Connect your channels</h1>
        <p className="mt-2 text-[13px] text-muted">
          Connect your own brand channels to replace public estimates with your real analytics.
          This is optional — you can skip any channel and connect later.
        </p>
      </div>

      {/* Value preview banner */}
      <div className="mb-6 rounded-[10px] border border-gold/30 bg-gold-bg px-4 py-3">
        <p className="text-[13px] text-gold-dark font-medium">
          Why connect?
        </p>
        <p className="text-[13px] text-muted mt-1">
          Right now your brief shows estimated reach for your brand. Connect Instagram and we replace
          that estimate with your actual reach, saves, and story views — data your competitors can never see.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CHANNELS.map((ch) => (
          <Card key={ch.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl mt-0.5">{ch.icon}</span>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{ch.name}</span>
                      {ch.reviewRequired && (
                        <Badge variant="watch" className="text-[10px]">
                          App review required
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-muted">{ch.description}</p>
                    <p className="text-[11px] text-muted font-mono mt-1">
                      Scopes: {ch.scopes}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-[13px] text-muted text-center">
        All OAuth connections are read-only. We never post on your behalf.
      </p>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="ghost" asChild>
          <a href="/onboarding/competitors">← Back</a>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <a href="/onboarding/recipients" className="text-muted hover:text-ink">
              Skip for now
            </a>
          </Button>
          <Button asChild>
            <a href="/onboarding/recipients">Continue →</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
