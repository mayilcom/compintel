import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Product — Mayil',
  description:
    'Mayil is a marketing channel intelligence brief delivered every Sunday morning. Cross-brand panel scoring, synthesised signals, and verified claims — not raw data.',
}

const INTELLIGENCE = [
  {
    label: 'Cross-brand panel scoring',
    body:
      'Every metric is ranked against your peer panel for the week. Headlines lead with relative position, "HubSpot posted 3.5x the panel median" not week-over-week noise. Briefs are meaningful from the first week onwards.',
  },
  {
    label: 'Signal synthesis',
    body:
      'Related signals across channels are clustered into a single story. A team hire, website change, and a Google Ads spike that all point at the same competitor become one narrative, not three disconnected bullet points.',
  },
  {
    label: 'Verified claims',
    body:
      'Every number in the brief is traced back to its source data point before delivery. Unsupported claims and predictions are blocked from shipping. The brief tells you what happened, never what might happen.',
  },
]

const QUESTIONS = [
  {
    n: '01',
    q: 'What did our competitors spend on last week?',
    a: 'Active ads, paid-search activity, and creative refresh rates — across every competitor in your panel.',
  },
  {
    n: '02',
    q: 'What new creative are they running — and who is it for?',
    a: 'New ad units, the audience cues, and the messaging themes that signal a campaign push 7–10 days early.',
  },
  {
    n: '03',
    q: 'What is the press saying about them — and how loudly?',
    a: 'Coverage volume, headline framing, publication mix — so you see when a competitor is being talked about, and where.',
  },
  {
    n: '04',
    q: 'Are their customers getting happier or unhappier?',
    a: 'Rating trajectories, review velocity, and the categories of complaints showing up in the last seven days.',
  },
  {
    n: '05',
    q: 'Where did they go quiet — and what does the silence mean?',
    a: 'A two-week gap in paid activity, a paused content cadence, a missing press mention — silence is its own signal.',
  },
]

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
        <p className="label-section mb-4">The product</p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] text-ink leading-[1.05] tracking-tight mb-8 max-w-5xl">
          One brief. Every Sunday.<br />Your competitors, decoded.
        </h1>
        <p className="text-lg md:text-xl text-muted leading-relaxed max-w-3xl mb-10">
          Mayil watches your competitors across the web and delivers a single AI-interpreted brief every Sunday at 8am. Not a dashboard. Not a feed. A weekly read that tells you what changed and what to do about it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up?plan=growth">
            <Button size="lg">Start free trial →</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">See pricing</Button>
          </Link>
        </div>
        <p className="mt-5 text-sm text-muted">14-day trial · Card required · Cancel anytime.</p>
      </section>

      {/* ── Intelligence layer (the moat) ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">What makes Mayil different</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">Three engines, one brief.</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mb-14 leading-relaxed">
            Most competitive intelligence tools are scrapers with a dashboard bolted on. Mayil is built around the intelligence, the part that turns raw data into something you actually act on.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {INTELLIGENCE.map(item => (
              <div key={item.label} className="rounded-[12px] border border-border bg-paper p-8">
                <h3 className="text-xl font-semibold text-ink mb-4">{item.label}</h3>
                <p className="text-base text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Questions the brief answers ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">What the brief answers</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6 max-w-3xl">Questions a Mayil brief answers each Sunday.</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mb-14 leading-relaxed">
            The five questions a founder or marketing head would ask on a Sunday morning if they had the time to read every channel themselves.
          </p>

          <div className="rounded-[14px] border border-border bg-surface overflow-hidden max-w-5xl">
            {QUESTIONS.map((item, i) => (
              <div
                key={item.n}
                className={`flex flex-col gap-4 p-8 sm:flex-row sm:items-baseline sm:gap-10 ${
                  i < QUESTIONS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="font-mono text-sm text-gold shrink-0 sm:w-12">{item.n}</span>
                <div className="flex-1">
                  <h3 className="font-display text-xl md:text-2xl text-ink mb-3 leading-snug">&ldquo;{item.q}&rdquo;</h3>
                  <p className="text-base text-muted leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where Mayil reads ── */}
      <section id="channels" className="border-t border-border bg-surface scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">Where Mayil reads</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-8 max-w-3xl">Wherever your competitors actually market.</h2>
          <p className="text-lg md:text-xl text-muted leading-relaxed max-w-3xl">
            Paid ad surfaces, organic social, marketplace listings and reviews, news coverage, and search activity. If a competitive move shows up in public, the brief sees it — and the surfaces we read keep growing without changing your subscription.
          </p>
        </div>
      </section>

      {/* ── Sample brief ── */}
      <section id="sample-brief" className="border-t border-border bg-paper scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">A sample brief</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-14">What lands in your inbox.</h2>
          <div className="mx-auto max-w-2xl rounded-[14px] border border-border bg-surface shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-base text-ink">Mayil</span>
                <span className="label-section">Brief #14</span>
              </div>
              <span className="label-section">Apr 14–20, 2026</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="signal-bar-threat rounded-r-[10px] bg-[#FDECEA] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="threat">Threat</Badge>
                  <span className="text-sm text-muted">Meta Ad Library</span>
                </div>
                <p className="text-base font-semibold text-ink">HubSpot launched 23 new Meta ads — 4.6× the panel median across 6 tracked competitors.</p>
                <p className="text-sm text-muted mt-2 leading-relaxed">All target the SMB segment. Creative theme is consolidation: &quot;one platform replaces five.&quot; Largest paid push since their Q4 launch.</p>
              </div>
              <div className="signal-bar-opportunity rounded-r-[10px] bg-[#EBF7EE] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="opportunity">Opportunity</Badge>
                  <span className="text-sm text-muted">Google Search Ads</span>
                </div>
                <p className="text-base font-semibold text-ink">Salesforce paused all branded search ads for the third week running.</p>
                <p className="text-sm text-muted mt-2 leading-relaxed">Branded query coverage on the panel dropped to 0. Bid on their brand terms now while CPC is uncontested.</p>
              </div>
              <div className="signal-bar-watch rounded-r-[10px] bg-[#FBF5E4] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="watch">Watch</Badge>
                  <span className="text-sm text-muted">Google News</span>
                </div>
                <p className="text-base font-semibold text-ink">Zendesk appeared in 14 articles this week — every one mentions an AI-agent pivot.</p>
                <p className="text-sm text-muted mt-2 leading-relaxed">Coverage spread across TechCrunch, The Verge, and Reuters. Sustained PR push, not a one-off.</p>
              </div>
            </div>
            <div className="border-t border-border px-5 py-5 bg-surface-2">
              <p className="text-sm text-muted italic leading-relaxed">
                HubSpot is consolidating market position with a paid push three sustained weeks long. If your positioning is &quot;best-of-breed,&quot; how does your messaging counter &quot;all-in-one&quot; this week?
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-muted mt-8">
            Sample brief. Real briefs are personalised to your tracked brands and verified before delivery.
          </p>
        </div>
      </section>

      {/* ── Data handling / GDPR ── */}
      <section id="data-handling" className="border-t border-border bg-surface scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">Data handling &amp; privacy</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">We collect what&apos;s public. We protect what&apos;s yours.</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mb-14 leading-relaxed">
            Mayil tracks public competitor activity — posts, ads, reviews, news — using official APIs and public scraping. The only customer data we hold is what you give us during onboarding: brand and competitor names, channel handles, recipient emails, and your own analytics if you connect them.
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Where data lives</h3>
              <p className="text-base text-muted leading-relaxed">
                Customer data is encrypted at rest and isolated per account. Production runs in regions that meet GDPR adequacy.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Retention</h3>
              <p className="text-base text-muted leading-relaxed">
                Brief history is retained for the lifetime of your account. On account deletion, all customer data is purged within 30 days. You can request a data export at any time.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Your privacy rights</h3>
              <p className="text-base text-muted leading-relaxed">
                We honour access, rectification, erasure, and portability requests for any data subject — usually fulfilled within 14 days. Details on our <Link href="/privacy" className="text-gold-dark underline underline-offset-2 hover:text-gold">privacy page</Link>.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Data Processing Agreement</h3>
              <p className="text-base text-muted leading-relaxed">
                A standard DPA is available on request — we can sign yours or provide ours, including standard contractual clauses for international transfers. <Link href="/contact" className="text-gold-dark underline underline-offset-2 hover:text-gold">Get in touch</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">
            Start tracking your competitors this Sunday.
          </h2>
          <p className="text-base md:text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            14-day free trial. Card required at signup so the trial converts cleanly. Cancel any time before day 14 and you&apos;re never charged.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/sign-up?plan=growth">
              <Button size="lg">Start free trial →</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">See pricing</Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
