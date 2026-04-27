import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const CHANNELS = [
  'Instagram', 'Meta Ad Library', 'Amazon Reviews', 'Google News',
  'Google Search Ads', 'Google Analytics', 'Google Search Console',
]

const STEPS = [
  {
    number: '01',
    title: 'Add your brand and competitors',
    body: 'Enter your brand name or domain. Mayil auto-discovers public channel handles for every brand. Confirm and you\'re set.',
  },
  {
    number: '02',
    title: 'Connect your own channels',
    body: 'Link Google Analytics and Search Console via OAuth to add first-party performance data alongside the competitive view.',
  },
  {
    number: '03',
    title: 'The pipeline runs every Saturday night',
    body: 'Eight workers — collect, diff, rank, synthesise, interpret, verify, assemble, deliver — run between Sat 8pm and Sun 7am IST.',
  },
  {
    number: '04',
    title: 'Brief lands in your inbox Sunday 7am',
    body: 'One email. A lead story. Supporting evidence. An activity catalog. A closing question that stays with you all week.',
  },
]

const INTELLIGENCE = [
  {
    title: 'Cross-brand panel scoring',
    body: 'Headlines lead with relative position — "HubSpot posted 3.5× the panel median" — not week-over-week noise.',
  },
  {
    title: 'Signal synthesis',
    body: 'Related signals across channels are clustered into one story. Three correlated facts beat three disconnected bullets.',
  },
  {
    title: 'Verified claims',
    body: 'Every number is traced back to its source data point. Unsupported claims and predictions are blocked from delivery.',
  },
]

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    price: 49,
    features: [
      '1 brand tracked',
      '3 competitors',
      'All channels',
      '3 email recipients',
      '1 team seat',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    slug: 'growth',
    name: 'Growth',
    price: 129,
    features: [
      '3 brands tracked',
      '10 competitors',
      'All channels',
      '10 email recipients',
      '3 team seats',
      'Triggered alerts',
      'Wednesday brief preview',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    price: 249,
    features: [
      '5 brands tracked',
      '15 competitors',
      'All channels',
      '15 email recipients',
      '5 team seats',
      'CSV export',
      'Custom-domain sending',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Badge variant="default" className="mb-6 mx-auto">
          14-day free trial · Card required at signup
        </Badge>
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl">
          Your market,<br />decoded weekly.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
          A weekly competitive intelligence brief for founders and marketing heads.
          Every Sunday at 7am, Mayil tells you what your competitors did last week —
          and what to do about it. Verified, synthesised, written. Not raw data.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/sign-up?plan=growth">
            <Button size="lg" className="w-full sm:w-auto">
              Start free trial →
            </Button>
          </Link>
          <Link href="/product">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              See how it works
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          First brief arrives the Sunday after signup. Cancel any time before day 14.
        </p>

        {/* Brief mockup preview */}
        <div className="mx-auto mt-16 max-w-2xl rounded-[14px] border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm text-ink">Mayil</span>
              <span className="label-section">Brief #14</span>
            </div>
            <span className="label-section">Apr 14–20, 2026</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="signal-bar-threat rounded-r-[10px] bg-[#FDECEA] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="threat">Threat</Badge>
                <span className="text-xs text-muted">Meta Ad Library</span>
              </div>
              <p className="text-sm font-semibold text-ink">HubSpot launched 23 new Meta ads — 4.6× the panel median.</p>
              <p className="text-[13px] text-muted mt-1">All target the SMB segment. Creative theme is consolidation: &quot;one platform replaces five.&quot;</p>
            </div>
            <div className="signal-bar-opportunity rounded-r-[10px] bg-[#EBF7EE] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="opportunity">Opportunity</Badge>
                <span className="text-xs text-muted">Google Search Ads</span>
              </div>
              <p className="text-sm font-semibold text-ink">Salesforce paused all branded search ads — third week running.</p>
              <p className="text-[13px] text-muted mt-1">Branded query coverage on the panel dropped to 0. Bid on their brand terms while CPC is uncontested.</p>
            </div>
            <div className="signal-bar-watch rounded-r-[10px] bg-[#FBF5E4] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="watch">Watch</Badge>
                <span className="text-xs text-muted">Google News</span>
              </div>
              <p className="text-sm font-semibold text-ink">Zendesk appeared in 14 articles — every one mentions an AI-agent pivot.</p>
              <p className="text-[13px] text-muted mt-1">Coverage spread across TechCrunch, The Verge, and Reuters. Sustained PR push, not a one-off.</p>
            </div>
          </div>
          <div className="border-t border-border px-5 py-4 bg-surface-2">
            <p className="text-[13px] text-muted italic">
              HubSpot is consolidating market position with three sustained weeks of paid push. If your positioning is &quot;best-of-breed,&quot; how does your messaging counter &quot;all-in-one&quot; this week?
            </p>
          </div>
        </div>
      </section>

      {/* ── Intelligence layer ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">What makes Mayil different</p>
          <h2 className="font-display text-3xl text-center text-ink mb-4">
            Three engines, one brief.
          </h2>
          <p className="text-center text-[14px] text-muted max-w-2xl mx-auto mb-14 leading-relaxed">
            Most competitive intelligence tools are scrapers with a dashboard bolted on. Mayil is built around the synthesis — the part that turns collection into something you actually act on.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {INTELLIGENCE.map(item => (
              <div key={item.title} className="rounded-[10px] border border-border bg-paper p-6">
                <h3 className="text-sm font-semibold text-ink mb-3">{item.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/product" className="text-[13px] text-gold-dark font-medium hover:text-gold transition-colors">
              See the full product →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">How it works</p>
          <h2 className="font-display text-3xl text-center text-ink mb-14">
            Set up once. Read every Sunday.
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col gap-3">
                <span className="font-mono text-2xl font-medium text-gold">
                  {step.number}
                </span>
                <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">Data sources</p>
          <h2 className="font-display text-3xl text-center text-ink mb-4">
            Every paid plan, every channel.
          </h2>
          <p className="text-center text-[13px] text-muted mb-12 max-w-xl mx-auto">
            We&apos;d rather list channels we ship well than promise channels we ship poorly. The list grows. Your subscription doesn&apos;t change.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CHANNELS.map((ch) => (
              <span
                key={ch}
                className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs font-medium text-muted"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            LinkedIn, YouTube, X, Reddit and more in development.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">Pricing</p>
          <h2 className="font-display text-3xl text-center text-ink mb-4">
            Pay for the brief. Not the channels.
          </h2>
          <p className="text-center text-[13px] text-muted mb-12">
            14-day trial on every plan. Card required at signup. Save two months on annual billing.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[14px] border p-6 flex flex-col gap-6 ${
                  plan.highlight
                    ? 'border-gold bg-gold-bg shadow-card ring-1 ring-gold/20'
                    : 'border-border bg-surface shadow-card'
                }`}
              >
                {plan.highlight && (
                  <span className="label-section text-gold-dark">Most popular</span>
                )}
                <div>
                  <h3 className="font-display text-xl text-ink">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-ink">${plan.price}</span>
                    <span className="text-[13px] text-muted">/month</span>
                  </div>
                  <p className="text-xs text-muted mt-1">USD · billed monthly</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
                      <span className="text-gold mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/sign-up?plan=${plan.slug}`}>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-[13px] text-gold-dark font-medium hover:text-gold transition-colors">
              Compare plans and see annual pricing →
            </Link>
          </div>

          {/* Enterprise */}
          <div className="mt-10 rounded-[14px] border border-border bg-surface-2 p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Enterprise — from $999/month</h3>
              <p className="text-[13px] text-muted mt-0.5">
                Unlimited everything. Dedicated solutions manager. SLA, DPA, EU data residency, and white-label sending.
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline" className="shrink-0">
                Talk to our team →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
