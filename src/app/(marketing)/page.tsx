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
    body: 'Enter your brand name or domain. Mayil discovers public channel handles for every brand. Confirm and you\'re set.',
  },
  {
    number: '02',
    title: 'Connect your own channels',
    body: 'Link Google Analytics and Search Console via OAuth to add first-party performance data alongside the competitive view.',
  },
  {
    number: '03',
    title: 'The pipeline runs every Saturday night',
    body: 'Our platform collect across marketing channels, analyze the data collected, and interpret over the night.',
  },
  {
    number: '04',
    title: 'Brief lands in your inbox Sunday 8am',
    body: 'One email. A lead story. Supporting evidence. An activity catalog. A closing question that stays with you all week.',
  },
]

const INTELLIGENCE = [
  {
    title: 'Cross-brand panel scoring',
    body: 'Headlines lead with relative position "HubSpot posted 3.5x the panel median" not week-over-week noise.',
  },
  {
    title: 'Signal intelligence',
    body: 'Related signals across channels are clustered into one story. Three correlated facts beat three disconnected bullets.',
  },
  {
    title: 'Verified claims',
    body: 'Every number is traced back to its source data point. Unsupported claims and predictions are blocked from delivery.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24 md:py-32 text-center">
        <Badge variant="default" className="mb-8 mx-auto">
          Marketing channel intelligence
        </Badge>
        <h1 className="font-display text-5xl leading-[1.3] tracking-tight text-ink md:text-[72px] lg:text-[72px]">
          The Sunday brief on<br />your competitors&apos; marketing.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-[1.3rem] text-muted leading-relaxed">
          Mayil reads your competitors across marketing channels every week and writes one brief that tells you what changed and what to do about it.
        </p>
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
        <p className="mt-6 text-sm text-muted">
          First brief arrives the Sunday after signup. Cancel any time before day 14.
        </p>

        {/* Brief mockup preview */}
        <div className="mx-auto mt-20 max-w-2xl rounded-[14px] border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-base text-ink">Mayil</span>
              <span className="label-section">Brief #14</span>
            </div>
            <span className="label-section">Apr 14–20, 2026</span>
          </div>
          <div className="p-5 space-y-3 text-left">
            <div className="signal-bar-threat rounded-r-[10px] bg-[#FDECEA] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="threat">Threat</Badge>
                <span className="text-sm text-muted">Meta Ad Library</span>
              </div>
              <p className="text-base font-semibold text-ink">HubSpot launched 23 new Meta ads — 4.6× the panel median.</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">All target the SMB segment. Creative theme is consolidation: &quot;one platform replaces five.&quot;</p>
            </div>
            <div className="signal-bar-opportunity rounded-r-[10px] bg-[#EBF7EE] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="opportunity">Opportunity</Badge>
                <span className="text-sm text-muted">Google Search Ads</span>
              </div>
              <p className="text-base font-semibold text-ink">Salesforce paused all branded search ads — third week running.</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">Branded query coverage on the panel dropped to 0. Bid on their brand terms while CPC is uncontested.</p>
            </div>
            <div className="signal-bar-watch rounded-r-[10px] bg-[#FBF5E4] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="watch">Watch</Badge>
                <span className="text-sm text-muted">Google News</span>
              </div>
              <p className="text-base font-semibold text-ink">Zendesk appeared in 14 articles — every one mentions an AI-agent pivot.</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">Coverage spread across TechCrunch, The Verge, and Reuters. Sustained PR push, not a one-off.</p>
            </div>
          </div>
          <div className="border-t border-border px-5 py-5 bg-surface-2 text-left">
            <p className="text-sm text-muted italic leading-relaxed">
              HubSpot is consolidating market position with three sustained weeks of paid push. If your positioning is &quot;best-of-breed,&quot; how does your messaging counter &quot;all-in-one&quot; this week?
            </p>
          </div>
        </div>
      </section>

      {/* ── Who reads it on Sunday ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section text-center mb-4">Who reads it on Sunday</p>
          <h2 className="font-display text-3xl text-center text-ink mb-16 md:text-5xl">
            Two reads, one brief.
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            <div className="rounded-[12px] border border-border bg-surface p-8">
              <p className="label-section mb-3">For founder</p>
              <h3 className="font-display text-2xl text-ink mb-4">The marketing head you haven&apos;t hired yet.</h3>
              <p className="text-base text-muted leading-relaxed">
                You&apos;re running marketing yourself or with a small team. Every Sunday at 8am, Mayil tells you what your competitors did, what it likely means, and one question to bring to the week.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-surface p-8">
              <p className="label-section mb-3">For CMO</p>
              <h3 className="font-display text-2xl text-ink mb-4">Your team&apos;s Monday morning starting point.</h3>
              <p className="text-base text-muted leading-relaxed">
                You lead a team across brands or work with agencies. Mayil is one shared brief so creative, paid, and brand work off the same competitive read without anyone having to compile it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intelligence layer ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section text-center mb-4">What makes Mayil different</p>
          <h2 className="font-display text-3xl text-center text-ink mb-6 md:text-5xl">
            Three engines, one brief.
          </h2>
          <p className="text-center text-base md:text-lg text-muted max-w-3xl mx-auto mb-16 leading-relaxed">
            Most competitive intelligence tools are scrapers with a dashboard bolted on. Mayil is built around the intelligence, the part that turns data collection into something you actually act on.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {INTELLIGENCE.map(item => (
              <div key={item.title} className="rounded-[12px] border border-border bg-paper p-8">
                <h3 className="text-xl font-semibold text-ink mb-4">{item.title}</h3>
                <p className="text-base text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/product" className="text-base text-gold-dark font-medium hover:text-gold transition-colors">
              See the full product →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section text-center mb-4">How it works</p>
          <h2 className="font-display text-3xl text-center text-ink mb-16 md:text-5xl">
            Set up once. Read every Sunday.
          </h2>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col gap-4">
                <span className="font-mono text-3xl font-medium text-gold">
                  {step.number}
                </span>
                <h3 className="text-xl font-semibold text-ink">{step.title}</h3>
                <p className="text-base text-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section text-center mb-4">Data sources</p>
          <h2 className="font-display text-3xl text-center text-ink mb-6 md:text-5xl">
            Every paid plan, every channel.
          </h2>
          <p className="text-center text-base md:text-lg text-muted mb-14 max-w-2xl mx-auto leading-relaxed">
            We&apos;d rather list channels we ship well than promise channels we ship poorly. The list grows. Your subscription doesn&apos;t change.
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {CHANNELS.map((ch) => (
              <span
                key={ch}
                className="rounded-full border border-border bg-paper px-4 py-2 text-base font-medium text-muted"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            LinkedIn, YouTube, X, Reddit and more in development.
          </p>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">
            Your first brief, this Sunday.
          </h2>
          <p className="text-base md:text-lg text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            14-day trial on every plan. Card required at signup. Cancel any time before the trial period ends to avoid being charged.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/sign-up?plan=growth">
              <Button size="lg">Start free trial →</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">See pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
