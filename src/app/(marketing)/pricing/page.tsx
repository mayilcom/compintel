'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    slug:        'starter',
    name:        'Starter',
    priceMonthly: 49,
    priceAnnual:  39,
    annualTotal:  468,
    description: 'For founders tracking one product line and a small competitive set.',
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
    priceAnnual:  99,
    annualTotal:  1188,
    description: 'For marketing teams running multiple brands or expanding categories.',
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
    priceAnnual:  199,
    annualTotal:  2388,
    description: 'For consultancies and growth agencies running CI for clients.',
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
    a: 'Card-on-file at signup keeps the trial-to-paid conversion clean — no day-15 cron, no missed emails, no surprise interruptions to your brief. Cancel any time before day 14 in your subscription settings and you are never charged.',
  },
  {
    q: 'What counts as a "brand"?',
    a: 'A brand is one entity you receive briefs about. If you track Stripe and Adyen as a single brand pair, that is one brand with one competitor. If your company runs three product lines and you want a separate brief for each, that is three brands.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes — upgrade or downgrade any time from your subscription settings. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'What happens if I exceed a limit?',
    a: 'You will be prompted to upgrade before adding the extra brand, competitor, or recipient. Existing limits are never silently downgraded.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes — annual billing saves you two months on every plan. Toggle the billing cycle above to compare.',
  },
  {
    q: 'How is my own data handled?',
    a: 'Customer data lives in Supabase (PostgreSQL) with row-level security on every table. We honour GDPR access, rectification, erasure, and portability requests. EU data residency is available on Enterprise. Full details on the product page.',
  },
  {
    q: 'Where do you operate?',
    a: 'Mayil is global. Pricing is in USD; payments are processed by Stripe. Briefs deliver in your local timezone with consistent Sunday-morning timing.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-paper font-body">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="label-section mb-3">Pricing</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6 md:text-5xl">
          Pay for the brief.<br />Not for the channels.
        </h1>
        <p className="mx-auto max-w-2xl text-[15px] text-muted leading-relaxed mb-10">
          Every paid plan includes every channel we collect. We grow the channel list; your subscription stays the same. All prices in USD, billed via Stripe.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-1 rounded-[8px] border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-[6px] px-4 py-1.5 text-[12px] font-medium transition-colors ${
              !annual ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 rounded-[6px] px-4 py-1.5 text-[12px] font-medium transition-colors ${
              annual ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            Annual
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              annual ? 'bg-opportunity/20 text-opportunity' : 'bg-surface-2 text-muted'
            }`}>
              Save 2 months
            </span>
          </button>
        </div>
      </section>

      {/* ── Tier cards ── */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map(plan => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly
            return (
              <div
                key={plan.slug}
                className={`rounded-[14px] border p-6 flex flex-col gap-6 ${
                  plan.highlight
                    ? 'border-gold bg-gold-bg shadow-card ring-1 ring-gold/20'
                    : 'border-border bg-surface shadow-card'
                }`}
              >
                <div>
                  {plan.highlight && (
                    <span className="label-section text-gold-dark mb-3 inline-block">Most popular</span>
                  )}
                  <h2 className="font-display text-xl text-ink">{plan.name}</h2>
                  <p className="mt-1 text-[12px] text-muted leading-relaxed min-h-[36px]">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-ink">${price}</span>
                    <span className="text-[13px] text-muted">/month</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted min-h-[16px]">
                    {annual ? `$${plan.annualTotal.toLocaleString('en-US')} billed annually` : 'Billed monthly'}
                  </p>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
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
            )
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          14-day free trial on every plan · Card required at signup · Cancel any time before day 14 to avoid being charged
        </p>
      </section>

      {/* ── Enterprise ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="label-section mb-3">Enterprise</p>
          <h2 className="font-display text-3xl text-ink mb-4">Built for portfolio-scale brand teams.</h2>
          <p className="text-[15px] text-muted leading-relaxed mb-10 max-w-2xl">
            For organisations tracking 10+ brands, running CI for client portfolios, or operating in regulated markets where DPAs, SLAs, and data residency are non-negotiable.
          </p>

          <div className="rounded-[14px] border border-border bg-paper shadow-card p-8 grid gap-8 md:grid-cols-[2fr_3fr]">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="label-section mb-2">Custom pricing</p>
                <p className="font-display text-3xl text-ink mb-2">From $999<span className="text-base text-muted">/month</span></p>
                <p className="text-[13px] text-muted leading-relaxed">
                  Pricing is built around your portfolio size, brief cadence, and infrastructure requirements. Annual contracts. Quarterly business reviews included.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/contact">
                  <Button size="lg" className="w-full sm:w-auto">Talk to our team →</Button>
                </Link>
                <Link href="/solutions" className="text-[12px] text-muted hover:text-ink transition-colors">
                  Or browse enterprise solutions →
                </Link>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                  <span className="text-gold mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="label-section text-center mb-3">FAQ</p>
          <h2 className="font-display text-2xl text-ink text-center mb-12">Common questions.</h2>
          <div className="flex flex-col gap-2">
            {FAQ.map(item => (
              <details
                key={item.q}
                className="group rounded-[10px] border border-border bg-surface px-5 py-4 transition-colors hover:border-gold/30 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-ink list-none">
                  {item.q}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0 text-muted transition-transform group-open:rotate-45"
                  >
                    <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-[13px] text-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-display text-2xl text-ink mb-4">
            Your first brief, this Sunday.
          </h2>
          <p className="text-[14px] text-muted mb-8 max-w-xl mx-auto">
            Start the trial today. Add your brand and competitors in under five minutes. The brief lands at 7am on Sunday in your timezone.
          </p>
          <Link href="/sign-up?plan=growth">
            <Button size="lg">Start free trial →</Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
