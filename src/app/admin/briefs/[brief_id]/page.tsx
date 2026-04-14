import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = { title: 'Edit Brief — Admin' }

// In production: fetch brief + signals from Supabase using service role key
export default function AdminBriefEditorPage({
  params,
}: {
  params: { brief_id: string }
}) {
  const brief = {
    id: params.brief_id,
    accountName: 'Sunfeast / ITC',
    issueNumber: 12,
    weekRange: 'Apr 14–20, 2026',
    headline: 'Britannia broke its silence — 14 posts in 4 days before Onam',
    closingQuestion:
      'Oreo has a Diwali gifting pack running in Meta ads since Sep 3. Britannia has a health-gifting angle timed before Onam. Does Dark Fantasy have a festive gifting strategy for Q3?',
    status: 'assembled',
    signals: [
      {
        id: 'sig_001',
        type: 'threat',
        channel: 'Instagram',
        competitor: 'Britannia',
        headline: 'Britannia posted 14 times in 4 days — 178% above their 4-week average',
        body: 'All NutriChoice. Story views up 3.1×. 4 paid partnership posts with health influencers in the 100K–500K tier. Activity started Sep 3, two weeks before Onam.',
        implication:
          "Sunfeast's Farmlite has no visible Onam content. If Britannia is buying shelf space two weeks before the festival, Farmlite is already behind.",
        score: 92,
      },
      {
        id: 'sig_002',
        type: 'opportunity',
        channel: 'Amazon',
        competitor: 'Parle-G',
        headline: "Parle-G's Amazon rating dropped to 4.1 — 47 packaging complaints this week",
        body: 'Down from 4.3 three weeks ago. Complaints concentrated on Blinkit and Swiggy Instamart fulfilment.',
        implication:
          'Sunfeast has a packaging quality window on quick commerce. A sampling campaign on Blinkit this month reaches consumers who just had a bad Parle experience.',
        score: 78,
      },
    ],
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/briefs" className="text-[11px] text-muted hover:text-ink transition-colors">
              ← All briefs
            </Link>
          </div>
          <h1 className="font-display text-xl text-ink">
            Brief #{brief.issueNumber} — {brief.accountName}
          </h1>
          <p className="text-[13px] text-muted">{brief.weekRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              brief.status === 'assembled' ? 'watch'
              : brief.status === 'sent'     ? 'opportunity'
              : brief.status === 'held'     ? 'threat'
              : 'silence'
            }
            className="text-[10px]"
          >
            {brief.status}
          </Badge>
          <Button size="sm" variant="outline">Hold</Button>
          <Button size="sm">Approve</Button>
        </div>
      </div>

      {/* Brief headline + closing question */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Brief headline</label>
            <textarea
              defaultValue={brief.headline}
              rows={2}
              className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Closing question</label>
            <textarea
              defaultValue={brief.closingQuestion}
              rows={3}
              className="rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signals */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="label-section">Signals ({brief.signals.length})</p>
          <Button size="sm" variant="outline">+ Add signal</Button>
        </div>
        {brief.signals.map((signal) => (
          <Card key={signal.id}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={signal.type as 'threat' | 'opportunity' | 'watch' | 'trend'}
                    className="text-[10px]"
                  >
                    {signal.type}
                  </Badge>
                  <span className="text-[11px] text-muted">{signal.channel} · {signal.competitor}</span>
                  <span className="text-[11px] font-mono text-muted">score: {signal.score}</span>
                </div>
                <button className="text-[11px] text-muted hover:text-threat transition-colors">
                  Remove
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">Headline</label>
                <input
                  type="text"
                  defaultValue={signal.headline}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">Body</label>
                <textarea
                  defaultValue={signal.body}
                  rows={2}
                  className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-section">What this means for you</label>
                <textarea
                  defaultValue={signal.implication}
                  rows={2}
                  className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" size="sm">Discard changes</Button>
        <Button size="sm">Save changes</Button>
      </div>
    </div>
  )
}
