import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Solutions — Mayil',
  description: 'Competitive intelligence built for portfolio-scale brand teams. Dedicated solutions manager, unlimited brands, and custom brief architecture.',
}

const INDUSTRIES = [
  {
    label: 'FMCG & CPG',
    description: 'Track competitor SKUs, festive campaigns, Amazon ratings, and quick commerce presence across your entire category.',
    href: '/solutions/fmcg',
  },
  {
    label: 'Ecommerce & D2C',
    description: 'Monitor Meta ad spend signals, Amazon ratings, quick commerce listings, and Instagram for every D2C brand you compete with.',
    href: '/solutions/ecommerce',
  },
  {
    label: 'Tech & SaaS',
    description: 'Catch competitor feature launches, pricing page changes, and Google Ads activity before they affect your pipeline.',
    href: '/solutions/tech',
  },
  {
    label: 'Agencies',
    description: 'Run competitive intelligence for all your clients from one workspace — separate briefs, shared team access, custom domain sending.',
    href: '/solutions/agency',
  },
]

const DIFFERENTIATORS = [
  {
    title: 'Portfolio-scale tracking',
    body: 'Unlimited brands, SKUs, and competitor sets. Brief architecture maps to your category structure — whether you have 3 brands or 30.',
  },
  {
    title: 'Dedicated solutions manager',
    body: 'Your manager configures brief cadence, signal priorities, and delivery routing. Quarterly reviews included. One person who knows your business.',
  },
  {
    title: 'Custom brief architecture',
    body: 'Separate briefs per brand, per category, or a single portfolio overview. Frequency, recipients, and signal focus are all configurable.',
  },
  {
    title: 'Enterprise-grade infrastructure',
    body: 'SOC 2-ready stack. Data hosted on Supabase with row-level security. SSO via your identity provider. SLA available.',
  },
]

const ONBOARDING_STEPS = [
  { step: '01', title: 'Discovery call', body: 'We learn your competitive landscape — brands, categories, markets, and what decisions the brief needs to inform.' },
  { step: '02', title: 'Configuration', body: 'We configure brands, competitors, channels, and brief format to your structure. You review before anything goes live.' },
  { step: '03', title: 'First brief within 14 days', body: 'Your first brief arrives the Sunday after setup. Your solutions manager is available for questions.' },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-paper font-body">

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="label-section mb-3">Solutions</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 max-w-3xl">
          Competitive intelligence built for the scale of your portfolio.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl mb-8">
          Most competitive intelligence tools were built for one brand with five competitors.
          If you track 10 brands, 50 SKUs, and 8 categories — you need something built for that scale.
          Mayil Enterprise includes a dedicated solutions manager, custom brief architecture, and unlimited tracking.
        </p>
        <div className="flex gap-3">
          <Link href="/contact">
            <Button size="lg">Talk to our team →</Button>
          </Link>
          <Link href="/product">
            <Button variant="outline" size="lg">See how Mayil works</Button>
          </Link>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">What's different at enterprise scale</p>
          <h2 className="font-display text-2xl text-ink mb-12">Built for complexity, not workarounds.</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} className="rounded-[10px] border border-border bg-paper p-6">
                <h3 className="text-sm font-semibold text-ink mb-2">{d.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">By industry</p>
          <h2 className="font-display text-2xl text-ink mb-12">Solutions shaped around your category.</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {INDUSTRIES.map(ind => (
              <Link key={ind.href} href={ind.href} className="group block">
                <div className="rounded-[10px] border border-border bg-surface p-6 h-full hover:border-gold/40 transition-colors">
                  <h3 className="text-sm font-semibold text-ink mb-2 group-hover:text-gold-dark transition-colors">{ind.label}</h3>
                  <p className="text-[13px] text-muted leading-relaxed">{ind.description}</p>
                  <p className="mt-4 text-[12px] text-gold-dark font-medium">Learn more →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">Onboarding</p>
          <h2 className="font-display text-2xl text-ink mb-12">First brief in 14 days.</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {ONBOARDING_STEPS.map(s => (
              <div key={s.step}>
                <span className="font-mono text-2xl font-medium text-gold block mb-3">{s.step}</span>
                <h3 className="text-sm font-semibold text-ink mb-2">{s.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="font-display text-2xl text-ink mb-4">
            Talk to our enterprise team.
          </h2>
          <p className="text-[14px] text-muted mb-8 max-w-xl mx-auto">
            We&apos;ll show you a brief built around your portfolio — your brands, your competitors, your category.
          </p>
          <Link href="/contact">
            <Button size="lg">Request a demo →</Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
