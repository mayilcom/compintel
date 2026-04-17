import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Mayil for Tech & SaaS — Solutions',
  description: 'Track competitor feature launches, pricing page changes, Google Ads activity, and LinkedIn content before they affect your pipeline.',
}

const SIGNALS = [
  { type: 'threat' as const, channel: 'Google Ads', headline: 'Zoho CRM launched 11 new Google Ads this week', body: 'All targeting "CRM for small business India". Average position 1.2. Bid spike of 40% vs last month — likely tied to a push against Salesforce pricing.' },
  { type: 'opportunity' as const, channel: 'LinkedIn', headline: 'Freshdesk paused LinkedIn content for 18 days', body: 'No organic posts since Oct 14. No paid campaigns active. Unusual for their team — possible reorg or product pivot. Window to capture mindshare.' },
  { type: 'watch' as const, channel: 'News / PR', headline: 'Chargebee mentioned in 4 fintech publications this week', body: 'All coverage tied to a new Series D. Expansion into Southeast Asia likely within 2 quarters. Adjacent category pressure incoming.' },
]

const VARIANT_MAP = {
  threat: { bar: 'border-l-4 border-threat bg-[#FDECEA]', badge: 'threat' as const },
  opportunity: { bar: 'border-l-4 border-opportunity bg-[#EBF7EE]', badge: 'opportunity' as const },
  watch: { bar: 'border-l-4 border-watch bg-[#FBF5E4]', badge: 'watch' as const },
}

const USE_CASES = [
  { title: 'Catch a competitor pricing change before it hits your sales calls', body: 'Google Ads copy change + landing page update + new LinkedIn content = pricing repositioning. Mayil sequences these signals so you brief your sales team before prospects ask.' },
  { title: 'Spot a feature launch 2 weeks early', body: 'A competitor\'s engineering blog post + a LinkedIn update from their product team + a new Google Ads creative mentioning a feature — together they\'re a launch signal.', href: '/use-cases/spot-saas-feature-launch' },
  { title: 'Know when a competitor goes quiet', body: 'A 2-week pause in paid activity, zero LinkedIn posts, no press coverage — that\'s a signal too. Budget freeze, leadership change, or product pivot. Your brief surfaces silence, not just noise.' },
]

export default function TechSolutionPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/solutions" className="text-[12px] text-muted hover:text-ink transition-colors mb-6 block">← All solutions</Link>
        <p className="label-section mb-3">Tech & SaaS</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 max-w-3xl">
          Know what your SaaS competitors are building, bidding, and saying — weekly.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl mb-8">
          SaaS competitive moves happen fast and across channels — a pricing tweak, a Google Ads push, a feature teased on LinkedIn.
          Mayil connects the dots across 12 channels and delivers one brief every Sunday, so your team is briefed before the week starts.
        </p>
        <Link href="/contact"><Button size="lg">See a brief for your category →</Button></Link>
      </section>

      {/* Sample signals */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">What lands in your brief</p>
          <h2 className="font-display text-2xl text-ink mb-10">SaaS signals, interpreted.</h2>
          <div className="flex flex-col gap-4 max-w-2xl">
            {SIGNALS.map(s => (
              <div key={s.headline} className={`rounded-r-[10px] p-4 ${VARIANT_MAP[s.type].bar}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={VARIANT_MAP[s.type].badge}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</Badge>
                  <span className="text-xs text-muted">{s.channel}</span>
                </div>
                <p className="text-sm font-semibold text-ink">{s.headline}</p>
                <p className="text-[13px] text-muted mt-1">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">Use cases</p>
          <h2 className="font-display text-2xl text-ink mb-10">How SaaS teams use Mayil.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASES.map(uc => (
              <div key={uc.title} className="rounded-[10px] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">{uc.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-xl text-ink mb-1">Ready to track your competitors?</h2>
            <p className="text-[13px] text-muted">14-day free trial. First brief within 7 days of signup.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/sign-up"><Button>Start free trial</Button></Link>
            <Link href="/contact"><Button variant="outline">Request a demo</Button></Link>
          </div>
        </div>
      </section>

    </div>
  )
}
