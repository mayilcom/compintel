import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface CompetitorRow {
  brand_id:    string
  brand_name:  string
  instagram_handle: string | null
  /** From instagram snapshot metrics */
  follower_count:   number | null
  post_count_7d:    number | null
  last_post_date:   string | null
  /** From meta_ads snapshot metrics */
  active_ad_count:  number | null
  new_ads_7d:       number | null
  /** From amazon snapshot metrics */
  avg_rating:       number | null
  prev_avg_rating:  number | null  // from prior week snapshot for delta
}

interface CompetitorTableProps {
  competitors: CompetitorRow[]
}

function formatFollowers(n: number | null): string {
  if (n == null) return '—'
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`   // Indian lakh notation
  if (n >= 1_000)   return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatLastPost(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days <= 6)  return `${days}d ago`
  if (days <= 13) return '1 week ago'
  return `${Math.floor(days / 7)}w ago`
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  if (competitors.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-sm font-medium text-ink">No competitors added yet</p>
          <p className="text-[13px] text-muted mt-1">
            Add your first competitor to start tracking.
          </p>
          <a
            href="/onboarding/competitors"
            className="mt-4 text-sm text-gold hover:text-gold-dark transition-colors font-medium"
          >
            Add competitors →
          </a>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-3 text-left label-section">Competitor</th>
              <th className="px-4 py-3 text-right label-section">IG followers</th>
              <th className="px-4 py-3 text-center label-section">Last post</th>
              <th className="px-4 py-3 text-center label-section">Active ads</th>
              <th className="px-4 py-3 text-center label-section">Amazon ★</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => {
              const ratingDelta = c.avg_rating != null && c.prev_avg_rating != null
                ? +(c.avg_rating - c.prev_avg_rating).toFixed(1)
                : null

              const silenceThreshold = 14 // days without a post = muted red
              const lastPostDays = c.last_post_date
                ? Math.floor((Date.now() - new Date(c.last_post_date).getTime()) / (1000 * 60 * 60 * 24))
                : null
              const isSilent = lastPostDays != null && lastPostDays >= silenceThreshold

              return (
                <tr
                  key={c.brand_id}
                  className={`border-b border-border last:border-0 hover:bg-surface-2 transition-colors ${
                    i % 2 === 0 ? 'bg-surface' : 'bg-paper'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-ink">{c.brand_name}</p>
                      {c.instagram_handle && (
                        <p className="text-[11px] text-muted font-mono">@{c.instagram_handle}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-[13px] text-ink">
                    {formatFollowers(c.follower_count)}
                  </td>

                  <td className={`px-4 py-3 text-center text-[13px] ${isSilent ? 'text-threat/70' : 'text-muted'}`}>
                    {formatLastPost(c.last_post_date)}
                    {isSilent && <span className="block text-[10px] text-threat font-mono">silent</span>}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono text-[13px] text-ink">
                        {c.active_ad_count ?? '—'}
                      </span>
                      {(c.new_ads_7d ?? 0) > 0 && (
                        <Badge variant="watch" className="text-[10px] py-0 px-1.5">
                          +{c.new_ads_7d} new
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono text-[13px] text-ink">
                        {c.avg_rating ?? '—'}
                      </span>
                      {ratingDelta !== null && ratingDelta !== 0 && (
                        <span className={`text-[11px] ${ratingDelta > 0 ? 'text-opportunity' : 'text-threat'}`}>
                          {ratingDelta > 0 ? `↑${ratingDelta}` : `↓${Math.abs(ratingDelta)}`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
