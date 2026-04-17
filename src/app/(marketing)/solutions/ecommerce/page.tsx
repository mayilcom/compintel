import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Mayil for Ecommerce & D2C — Solutions',
  description: 'Track Meta ad spend signals, Amazon ratings, quick commerce listings, and Instagram for every D2C brand you compete with.',
}

const SIGNALS = [
  { type: 'threat' as const, channel: 'Meta Ads', headline: 'Mamaearth launched 22 new Meta ads this week', body: 'All targeting 25–35F. Creative theme: "your skin deserves better". 3× ad count vs last week — major budget commitment.' },
  { type: 'opportunity' as const, channel: 'Amazon', headline: 'MCaffeine hero SKU dropped to 4.0 on quick commerce', body: '31 new 1-star reviews citing packaging leakage. Category search rank likely falling. Switching window: 2–3 weeks.' },
  { type: 'watch' as const, channel: 'Instagram', headline: 'Plum listed 4 new SKUs — posted 3 product-launch reels', body: 'Sunscreen category expansion. No paid activity yet. Quick commerce listing expected within 4 weeks based on prior launch pattern.' },
]

const VARIANT_MAP = {
  threat: { bar: 'border-l-4 border-threat bg-[#FDECEA]', badge: 'threat' as const },
  opportunity: { bar: 'border-l-4 border-opportunity bg-[#EBF7EE]', badge: 'opportunity' as const },
  watch: { bar: 'border-l-4 border-watch bg-[#FBF5E4]', badge: 'watch' as const },
}

const USE_CASES = [
  { title: 'Catch a competitor\'s Meta campaign before it peaks', body: 'New ad creatives + rising Instagram frequency is a reliable 10-day lead indicator for a paid push. See it in your Sunday brief.' },
  { title: 'Act on an Amazon rating drop', body: 'A competitor\'s hero SKU falls below 4.2. Category search rank drops. Dissatisfied customers are actively looking for an alternative — for 2–4 weeks.', href: '/use-cases/spot-amazon-rating-drop' },
  { title: 'Track SKU expansion on quick commerce', body: 'New ASIN + Instagram product post + news mention within 2 weeks means a competitor is expanding their category presence.', href: '/use-cases/track-sku-expansion' },
]

export default function EcommerceSolutionPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/solutions" className="text-[12px] text-muted hover:text-ink transition-colors mb-6 block">← All solutions</Link>
        <p className="label-section mb-3">Ecommerce & D2C</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 max-w-3xl">
          Track what your D2C competitors are spending, selling, and saying — weekly.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl mb-8">
          D2C brands move fast — new Meta ads weekly, Amazon ratings that shift overnight, SKU launches that appear on Blinkit before they hit Instagram.
          Mayil monitors all of it and delivers the signals that matter every Sunday.
        </p>
        <Link href="/contact"><Button size="lg">See a brief for your category →</Button></Link>
      </section>

      {/* Sample signals */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">What lands in your brief</p>
          <h2 className="font-display text-2xl text-ink mb-10">D2C signals, interpreted.</h2>
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
          <h2 className="font-display text-2xl text-ink mb-10">How D2C teams use Mayil.</h2>
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
