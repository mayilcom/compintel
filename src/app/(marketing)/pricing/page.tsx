'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    slug:        'starter',
    name:        'Starter',
    priceMonthly: 49,
    priceAnnual:  40.83,
    annualTotal:  490,
    description: 'For the founder who wants the marketing head they haven\'t hired yet — every Sunday at 7am.',
    features: [
      '1 brand tracked',
      '3 competitors',
      'All channels',
      '3 email recipients',
      '1 team seat',
      'Sunday brief',
    ],
    cta:       'Start free trial',
    highlight: false,
  },
  {
    slug:        'growth',
    name:        'Growth',
    priceMonthly: 129,
    priceAnnual:  107.5,
    annualTotal:  1290,
    description: 'For the CMO whose team needs one shared competitive read across brands — every Monday morning.',
    features: [
      '3 brands tracked',
      '10 competitors total',
      'All channels',
      '10 email recipients',
      '3 team seats',
      'Triggered alerts',
      'Wednesday brief preview',
    ],
    cta:       'Start free trial',
    highlight: true,
  },
  {
    slug:        'agency',
    name:        'Agency',
    priceMonthly: 249,
    priceAnnual:  207.5,
    annualTotal:  2490,
    description: 'For the operator running marketing intelligence for ten clients without losing a Friday.',
    features: [
      '5 brands tracked',
      '15 competitors total',
      'All channels',
      '15 email recipients',
      '5 team seats',
      'CSV export',
      'Custom-domain sending',
    ],
    cta:       'Start free trial',
    highlight: false,
  },
]

const ENTERPRISE_FEATURES = [
  'Unlimited brands and competitors',
  'Unlimited recipients and seats',
  'Dedicated solutions manager',
  'Custom brief architecture',
  'White-label sending and branding',
  'Service level agreement (SLA)',
  'Data Processing Agreement (DPA)',
  'EU data residency on request',
  'Single sign-on (SSO)',
  'Priority pipeline support',
]

const FAQ = [
  {
    q: 'Why do I need a card to start the trial?',
    a: 'Card at signup keeps the trial-to-paid conversion clean. No missed emails, no surprise interruptions to your brief. Cancel any time before the trial in your subscription settings and you are never charged.',
  },
  {
    q: 'What counts as a "brand"?',
    a: 'A brand is defined against the competitor you receive briefs about. If your brand has multiple products with multiple competitors, for each product you would need to track against their respective competition. For Google, Google Workspace against Microsoft Outlook, Google Cloud vs AWS and Gemini vs ChatGPT would be three brands.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes, upgrade or downgrade any time from your subscription settings. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'What happens if I exceed a limit?',
    a: 'You will be prompted to upgrade before adding the extra brand, competitor, or recipient. Existing limits are never silently downgraded.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes, annual billing saves you two months on every plan. Toggle the billing cycle above to compare.',
  },
  {
    q: 'How is my own data handled?',
    a: 'Customer data is encrypted at rest and isolated per account. We honour GDPR access, rectification, erasure, and portability requests. Full details on our privacy page.',
  },
  {
    q: 'Can you provide custom channels?',
    a: 'We are adding more channels in the future. If the list is part of it, you would receive the channels soon in your dashboard.',
  },
  {
    q: 'Is your support bot or human?',
    a: 'We are humans (Bots: hoping to ☺) and available for your queries.'
  }
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-paper font-body">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24 md:py-32 text-center">
        <p className="label-section mb-4">Pricing</p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink mb-8 md:text-7xl lg:text-[88px]">
          Pay for the brief.<br />Not for the channels.
        </h1>
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted leading-relaxed mb-12">
          Every paid plan includes every channel we collect. We grow the channel list; your subscription stays the same. All prices in USD.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-1 rounded-[10px] border border-border bg-surface p-1.5">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-[7px] px-5 py-2 text-sm font-medium transition-colors ${
              !annual ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-[7px] px-5 py-2 text-sm font-medium transition-colors ${
              annual ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            Annual
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              annual ? 'bg-opportunity/20 text-opportunity' : 'bg-surface-2 text-muted'
            }`}>
              Save 2 months
            </span>
          </button>
        </div>
      </section>

      {/* ── Tier cards ── */}
      <section className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 pb-16">
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {PLANS.map(plan => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly
            return (
              <div
                key={plan.slug}
                className={`rounded-[14px] border p-8 flex flex-col gap-7 ${
                  plan.highlight
                    ? 'border-gold bg-gold-bg shadow-card ring-1 ring-gold/20'
                    : 'border-border bg-surface shadow-card'
                }`}
              >
                <div>
                  <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
                  <p className="mt-2 text-base text-muted leading-relaxed min-h-[48px]">{plan.description}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-5xl font-semibold text-ink">${price}</span>
                    <span className="text-base text-muted">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-muted min-h-[20px]">
                    {annual ? `$${plan.annualTotal.toLocaleString('en-US')} billed annually` : 'Billed monthly'}
                  </p>
                </div>

                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-base text-ink">
                      <span className="text-gold mt-0.5 shrink-0 text-lg">✓</span>
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
            )
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          14-day free trial on every plan · Card required at signup · Cancel any time before day 14 to avoid being charged
        </p>
      </section>

      {/* ── Enterprise ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24">
          <p className="label-section mb-4">Enterprise</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">Built for portfolio-scale brand teams.</h2>
          <p className="text-base md:text-lg text-muted leading-relaxed mb-12 max-w-3xl">
            For organisations tracking 10+ brands, running CI for client portfolios, or operating in regulated markets where DPAs, SLAs, and data residency are non-negotiable.
          </p>

          <div className="rounded-[14px] border border-border bg-paper shadow-card p-10 grid gap-10 md:grid-cols-[2fr_3fr] max-w-6xl">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="label-section mb-3">Custom pricing</p>
                <p className="font-display text-4xl md:text-5xl text-ink mb-3">From $999<span className="text-xl text-muted">/month</span></p>
                <p className="text-base text-muted leading-relaxed">
                  Pricing is built around your portfolio size, brief cadence, and infrastructure requirements. Annual contracts. Quarterly business reviews included.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/contact">
                  <Button size="lg" className="w-full sm:w-auto">Talk to our team →</Button>
                </Link>
                <Link href="/solutions" className="text-sm text-muted hover:text-ink transition-colors">
                  Or browse enterprise solutions →
                </Link>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-base text-ink">
                  <span className="text-gold mt-0.5 shrink-0 text-lg">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-3xl px-6 md:px-10 py-24">
          <p className="label-section text-center mb-4">FAQ</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink text-center mb-16">Common questions.</h2>
          <div className="flex flex-col gap-3">
            {FAQ.map(item => (
              <details
                key={item.q}
                className="group rounded-[12px] border border-border bg-surface px-6 py-5 transition-colors hover:border-gold/30 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base md:text-lg font-medium text-ink list-none">
                  {item.q}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0 text-muted transition-transform group-open:rotate-45"
                  >
                    <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-4 text-base text-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-24 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink mb-6">
            Your first brief, this Sunday.
          </h2>
          <p className="text-base md:text-lg text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Start the trial today. Add your brand and competitors in under five minutes. The brief lands at 8am on Sunday in your timezone.
          </p>
          <Link href="/sign-up?plan=growth">
            <Button size="lg">Start free trial →</Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
