import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketingNav } from '@/components/marketing-nav'

const CHANNELS = [
  'Instagram', 'YouTube', 'LinkedIn', 'Google Trends',
  'Meta Ad Library', 'Amazon Reviews', 'Reddit', 'NewsAPI',
  'Google Search Console', 'Website Changes', 'Proxycurl', 'Flipkart',
]

const STEPS = [
  {
    number: '01',
    title: 'Add your brand and competitors',
    body: 'Enter your brand name or domain. Mayil auto-discovers public channel handles for all brands. Confirm and you\'re set.',
  },
  {
    number: '02',
    title: 'Connect your own channels',
    body: 'Link Google Search Console, YouTube, Instagram, and LinkedIn via OAuth. Replace public estimates with your real analytics.',
  },
  {
    number: '03',
    title: 'We track 12+ channels every week',
    body: 'Collection runs Monday 2am IST. Diff engine runs Tuesday. AI interprets signals Wednesday. Your brief is assembled and ready.',
  },
  {
    number: '04',
    title: 'Brief lands in your inbox Sunday 7am',
    body: 'One email. Three signals. Data grid. Press items. A closing question that stays with you all week.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    priceINR: 999,
    priceUSD: 15,
    priceEUR: 13,
    features: [
      '1 brand tracked',
      '3 competitors',
      '2 email recipients',
      '1 team seat',
      'All V1 channels',
      'Weekly brief every Sunday',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    priceINR: 2499,
    priceUSD: 49,
    priceEUR: 42,
    features: [
      '3 brands tracked',
      '5 competitors per brand',
      '5 email recipients',
      '3 team seats',
      'V1 + V2 channels',
      'Triggered email alerts',
      'Brief preview (Wednesday)',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Agency',
    priceINR: 5999,
    priceUSD: 149,
    priceEUR: 125,
    features: [
      '10 brands tracked',
      'Unlimited competitors',
      'Unlimited recipients',
      '10 team seats',
      'All channels',
      'CSV export',
      'Custom domain sending',
      'Brand overview list',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper font-body">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Badge variant="default" className="mb-6 mx-auto">
          14-day free trial · No credit card required
        </Badge>
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl">
          Your market,<br />decoded weekly.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
          A weekly competitive intelligence brief for founders and marketing heads.
          Tracks 12+ channels. Interprets signals with AI. Lands in your inbox every
          Sunday morning — without you logging into anything.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto">
              Start tracking free →
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              See how it works
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          First brief arrives within 7 days of signup.
        </p>

        {/* Brief mockup preview */}
        <div className="mx-auto mt-16 max-w-2xl rounded-[14px] border border-border bg-surface shadow-card overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm text-ink">Mayil</span>
              <span className="label-section">Brief #12</span>
            </div>
            <span className="label-section">Apr 14–20, 2026</span>
          </div>
          {/* Signal preview */}
          <div className="p-5 space-y-3">
            <div className="signal-bar-threat rounded-r-[10px] bg-[#FDECEA] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="threat">Threat</Badge>
                <span className="text-xs text-muted">Instagram</span>
              </div>
              <p className="text-sm font-semibold text-ink">Britannia posted 14 times in 4 days before Onam</p>
              <p className="text-[13px] text-muted mt-1">All NutriChoice. 178% above their 4-week average. Engagement up 2.3×.</p>
            </div>
            <div className="signal-bar-opportunity rounded-r-[10px] bg-[#EBF7EE] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="opportunity">Opportunity</Badge>
                <span className="text-xs text-muted">Amazon</span>
              </div>
              <p className="text-sm font-semibold text-ink">Parle-G rating dropped to 4.1 from packaging failures</p>
              <p className="text-[13px] text-muted mt-1">47 new 1-star reviews this week citing broken packaging on quick commerce.</p>
            </div>
            <div className="signal-bar-watch rounded-r-[10px] bg-[#FBF5E4] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="watch">Watch</Badge>
                <span className="text-xs text-muted">Meta Ads</span>
              </div>
              <p className="text-sm font-semibold text-ink">Oreo launched 8 new Meta ads targeting 18–34 F</p>
              <p className="text-[13px] text-muted mt-1">All creative shows gifting occasions. Campaign started Sep 3.</p>
            </div>
          </div>
          {/* Closing question */}
          <div className="border-t border-border px-5 py-4 bg-surface-2">
            <p className="text-[13px] text-muted italic">
              Oreo has a Diwali gifting pack running since Sep 3. Does your brand have a festive gifting strategy for Q3 — or will you react after the season opens?
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-border bg-surface">
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
      <section id="channels" className="border-t border-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">Data sources</p>
          <h2 className="font-display text-3xl text-center text-ink mb-4">
            12+ channels. One brief.
          </h2>
          <p className="text-center text-[13px] text-muted mb-12 max-w-xl mx-auto">
            Mayil monitors public competitor data and combines it with your real
            own-channel analytics via OAuth — all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CHANNELS.map((ch) => (
              <span
                key={ch}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted"
              >
                {ch}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="label-section text-center mb-3">Pricing</p>
          <h2 className="font-display text-3xl text-center text-ink mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-[13px] text-muted mb-12">
            14-day free trial on all plans. No credit card required.
            2 months free on annual billing.
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
                  <span className="label-section text-gold">Most popular</span>
                )}
                <div>
                  <h3 className="font-display text-xl text-ink">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-ink">
                      ₹{plan.priceINR.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[13px] text-muted">/month</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    ${plan.priceUSD} USD · €{plan.priceEUR} EUR
                  </p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-muted">
                      <span className="text-gold mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
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
          {/* Enterprise */}
          <div className="mt-6 rounded-[14px] border border-border bg-surface-2 p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Enterprise</h3>
              <p className="text-[13px] text-muted mt-0.5">
                Custom brands, unlimited seats, white-label sending, dedicated onboarding, SLA.
              </p>
            </div>
            <Link href="/solutions">
              <Button variant="outline" className="shrink-0">
                See enterprise solutions →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <span className="font-display text-base text-ink">Mayil</span>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted">
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Solutions</span>
              <Link href="/solutions/fmcg" className="hover:text-ink transition-colors">FMCG & CPG</Link>
              <Link href="/solutions/ecommerce" className="hover:text-ink transition-colors">Ecommerce & D2C</Link>
              <Link href="/solutions/tech" className="hover:text-ink transition-colors">Tech & SaaS</Link>
              <Link href="/solutions/agency" className="hover:text-ink transition-colors">Agencies</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Resources</span>
              <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
              <Link href="/use-cases" className="hover:text-ink transition-colors">Use Cases</Link>
              <Link href="/case-studies" className="hover:text-ink transition-colors">Case Studies</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Company</span>
              <Link href="/contact" className="hover:text-ink transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Mayil.
          </p>
        </div>
      </footer>
    </div>
  )
}
