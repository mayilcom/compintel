import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Mayil for FMCG & CPG — Solutions',
  description: 'Track competitor SKUs, festive campaigns, Amazon ratings, and Meta Ads for every FMCG and CPG brand in your category. Weekly brief every Sunday.',
}

const SIGNALS = [
  { type: 'threat' as const, channel: 'Instagram', headline: 'Britannia posted 14 times in 4 days before Onam', body: 'All NutriChoice. 178% above their 4-week average. Engagement up 2.3×. A paid push is likely 7–10 days out.' },
  { type: 'opportunity' as const, channel: 'Amazon', headline: 'Parle-G rating dropped to 4.1 from packaging failures', body: '47 new 1-star reviews this week citing broken packaging on quick commerce. Category search rank affected.' },
  { type: 'watch' as const, channel: 'Meta Ads', headline: 'Oreo launched 8 new Meta ads targeting 18–34F', body: 'All creative shows gifting occasions. 14 active variants. Campaign started Sep 3 — Diwali push confirmed.' },
]

const VARIANT_MAP = {
  threat: { bar: 'border-l-4 border-threat bg-[#FDECEA]', badge: 'threat' as const },
  opportunity: { bar: 'border-l-4 border-opportunity bg-[#EBF7EE]', badge: 'opportunity' as const },
  watch: { bar: 'border-l-4 border-watch bg-[#FBF5E4]', badge: 'watch' as const },
}

const USE_CASES = [
  { title: 'Catch a festive campaign 3 weeks early', body: 'Instagram frequency spike → Meta Ads new creatives → Google Trends rise. Mayil sequences these across your brief so you see the pattern before it peaks.', href: '/use-cases/catch-festive-campaign-early' },
  { title: 'Spot a competitor SKU launch on quick commerce', body: 'New ASINs, news coverage, and Instagram product posts align within a 2-week window. That\'s 6–8 weeks before general trade availability.', href: '/use-cases/track-sku-expansion' },
  { title: 'Act on an Amazon rating drop', body: 'A competitor\'s hero SKU drops 0.3 stars. 47 new 1-star reviews. Their category search rank falls. Your window to capture switching customers: 2–4 weeks.', href: '/use-cases/spot-amazon-rating-drop' },
]

export default function FMCGSolutionPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/solutions" className="text-[12px] text-muted hover:text-ink transition-colors mb-6 block">← All solutions</Link>
        <p className="label-section mb-3">FMCG & CPG</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 max-w-3xl">
          Know what Britannia, ITC, and Nestlé are doing — before your next brand review.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl mb-8">
          FMCG is fought on six fronts at once: shelf, search, social, quick commerce, PR, and paid.
          Mayil tracks all of them for every competitor in your category and delivers the signals that matter — every Sunday morning.
        </p>
        <Link href="/contact"><Button size="lg">See a brief for your category →</Button></Link>
      </section>

      {/* Sample signals */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">What lands in your brief</p>
          <h2 className="font-display text-2xl text-ink mb-10">Signals from your category, interpreted.</h2>
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
          <h2 className="font-display text-2xl text-ink mb-10">How FMCG teams use Mayil.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASES.map(uc => (
              <Link key={uc.href} href={uc.href} className="group block">
                <div className="rounded-[10px] border border-border bg-surface p-5 h-full hover:border-gold/40 transition-colors">
                  <h3 className="text-sm font-semibold text-ink mb-2 group-hover:text-gold-dark transition-colors">{uc.title}</h3>
                  <p className="text-[13px] text-muted leading-relaxed">{uc.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-xl text-ink mb-1">Ready to track your category?</h2>
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
