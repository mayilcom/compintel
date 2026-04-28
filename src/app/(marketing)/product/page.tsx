import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Product — Mayil',
  description:
    'Mayil is a competitive intelligence brief delivered every Sunday morning. Cross-brand panel scoring, synthesised signals, and verified claims — not raw data.',
}

const INTELLIGENCE = [
  {
    label: 'Cross-brand panel scoring',
    body:
      'Every metric is ranked against your peer panel for the week. Headlines lead with relative position — "HubSpot posted 3.5× the panel median" — not week-over-week noise. New customers get a meaningful first brief, not a baseline placeholder.',
  },
  {
    label: 'Signal synthesis',
    body:
      'Related signals across channels are clustered into a single story. A LinkedIn hire, a pricing-page change, and a Google Ads spike that all point at the same competitor become one narrative — not three disconnected bullet points.',
  },
  {
    label: 'Verified claims',
    body:
      'Every number in the brief is traced back to its source data point before delivery. Unsupported claims and predictions are blocked from shipping. The brief tells you what happened — never what might happen.',
  },
]

const PIPELINE = [
  { time: 'Sat 8pm', stage: 'Collect',     body: 'Snapshots from every tracked channel for every brand.' },
  { time: 'Sat 11pm', stage: 'Diff',        body: 'Week-over-week deltas computed for context.' },
  { time: 'Sun 12am', stage: 'Rank',        body: 'Cross-brand panel scoring assigns 1–100 to each signal.' },
  { time: 'Sun 1am',  stage: 'Synthesise',  body: 'Related signals clustered into evidence-backed stories.' },
  { time: 'Sun 2am',  stage: 'Interpret',   body: 'Claude rewrites each signal into publication-quality copy.' },
  { time: 'Sun 3am',  stage: 'Verify',      body: 'Every claim is checked against source data. Failures retry or drop.' },
  { time: 'Sun 4am',  stage: 'Assemble',    body: 'The lead story, supporting evidence, and activity catalog are stitched.' },
  { time: 'Sun 7am',  stage: 'Deliver',     body: 'Brief lands in inboxes — your week starts informed.' },
]

const CHANNELS_LIVE = [
  { name: 'Instagram',           detail: 'Posts, engagement, posting cadence, follower trends' },
  { name: 'Meta Ad Library',     detail: 'Active ads, new creatives, copy themes — via the official Graph API' },
  { name: 'Amazon Reviews',      detail: 'Rating trajectory, review volume, negative-review surfacing' },
  { name: 'Google News',         detail: 'Coverage volume, headlines, publication mix' },
  { name: 'Google Search Ads',   detail: 'Active search ad copy and headlines' },
  { name: 'Google Analytics',    detail: 'Your own session, traffic, and channel mix (OAuth)' },
  { name: 'Google Search Console', detail: 'Your own organic queries, clicks, and impressions (OAuth)' },
]

const CHANNELS_NEXT = ['LinkedIn', 'YouTube', 'Twitter / X', 'Reddit', 'Glassdoor', 'Trustpilot']

const SUBPROCESSORS = [
  { name: 'Supabase',  purpose: 'Primary database — accounts, brands, snapshots, signals, briefs' },
  { name: 'Clerk',     purpose: 'Authentication and team management' },
  { name: 'Stripe',    purpose: 'Subscription billing and payment processing' },
  { name: 'Anthropic', purpose: 'Claude — signal interpretation and verification' },
  { name: 'Resend',    purpose: 'Brief email delivery' },
  { name: 'Apify',     purpose: 'Public web scraping infrastructure for Instagram and Amazon' },
  { name: 'Vercel',    purpose: 'Application hosting' },
  { name: 'Railway',   purpose: 'Worker infrastructure for the weekly pipeline' },
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
          Mayil watches your competitors across the web — Instagram, Amazon, Meta Ads, Google News, Google Search Ads — and delivers a single AI-interpreted brief every Sunday at 7am. Not a dashboard. Not a feed. A weekly read that tells you what changed and what to do about it.
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
            Most competitive intelligence tools are scrapers with a dashboard bolted on. Mayil is built around the synthesis — the part that turns raw collection into something you actually act on.
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

      {/* ── How it works (real pipeline) ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">How the brief is built</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">From snapshot to inbox in eleven hours.</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mb-14 leading-relaxed">
            Eight workers run sequentially every Saturday night. By Sunday at 7am, the brief is in every recipient&apos;s inbox — verified, clustered, and written.
          </p>

          <div className="rounded-[14px] border border-border bg-surface overflow-hidden max-w-5xl">
            {PIPELINE.map((p, i) => (
              <div
                key={p.stage}
                className={`flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:gap-8 ${
                  i < PIPELINE.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-5 sm:w-56 shrink-0">
                  <span className="font-mono text-sm text-muted shrink-0 w-20">{p.time}</span>
                  <h3 className="text-lg font-semibold text-ink">{p.stage}</h3>
                </div>
                <p className="text-base text-muted leading-relaxed flex-1">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted">All times Indian Standard Time. Briefs are delivered in the recipient&apos;s timezone with consistent Sunday-morning timing wherever you are.</p>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-border bg-surface scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">Channels</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">What we collect — honestly.</h2>
          <p className="text-base md:text-lg text-muted max-w-3xl mb-14 leading-relaxed">
            Every paid plan includes every channel we collect. We&apos;d rather list five channels we ship well than promise twelve we ship poorly. The list grows; your subscription doesn&apos;t change.
          </p>

          <h3 className="text-xl font-semibold text-ink mb-5">Live in every brief</h3>
          <div className="rounded-[12px] border border-border bg-paper overflow-hidden mb-12 max-w-5xl">
            {CHANNELS_LIVE.map((c, i) => (
              <div
                key={c.name}
                className={`flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:gap-8 ${
                  i < CHANNELS_LIVE.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <h4 className="text-lg font-semibold text-ink sm:w-64 shrink-0">{c.name}</h4>
                <p className="text-base text-muted leading-relaxed flex-1">{c.detail}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-ink mb-5">In development</h3>
          <div className="flex flex-wrap gap-2">
            {CHANNELS_NEXT.map(ch => (
              <span
                key={ch}
                className="rounded-full border border-border bg-paper px-4 py-2 text-sm font-medium text-muted"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted">When a new channel ships, every existing customer gets it. No upgrade required.</p>
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

          <div className="grid gap-6 md:grid-cols-2 mb-14 max-w-5xl">
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Where data lives</h3>
              <p className="text-base text-muted leading-relaxed">
                Customer data is stored in Supabase (PostgreSQL) with row-level security on every table. Production infrastructure runs on Vercel and Railway. EU data residency is available on Enterprise plans.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Retention</h3>
              <p className="text-base text-muted leading-relaxed">
                Brief history is retained for the lifetime of your account. On account deletion, all customer data is purged within 30 days. You can request a data export at any time.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">GDPR &amp; privacy rights</h3>
              <p className="text-base text-muted leading-relaxed">
                We honour access, rectification, erasure, and portability requests for any data subject — usually fulfilled within 14 days. Email <a href="mailto:privacy@emayil.com" className="text-gold-dark underline underline-offset-2 hover:text-gold">privacy@emayil.com</a>.
              </p>
            </div>
            <div className="rounded-[12px] border border-border bg-paper p-8">
              <h3 className="text-xl font-semibold text-ink mb-3">Data Processing Agreement</h3>
              <p className="text-base text-muted leading-relaxed">
                A standard DPA is available on Enterprise plans. We can sign yours or provide ours, including standard contractual clauses for international transfers. <Link href="/contact" className="text-gold-dark underline underline-offset-2 hover:text-gold">Get in touch</Link>.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-ink mb-5">Sub-processors</h3>
          <div className="rounded-[12px] border border-border bg-paper overflow-hidden max-w-5xl">
            {SUBPROCESSORS.map((s, i) => (
              <div
                key={s.name}
                className={`flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:gap-8 ${
                  i < SUBPROCESSORS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <h4 className="text-lg font-semibold text-ink sm:w-44 shrink-0">{s.name}</h4>
                <p className="text-base text-muted leading-relaxed flex-1">{s.purpose}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted">We notify Enterprise customers in advance of any sub-processor changes.</p>
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
