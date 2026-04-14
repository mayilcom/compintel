'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PLANS = [
  {
    name:      'starter',
    label:     'Starter',
    price:     { INR: '₹999', USD: '$15', EUR: '€13' },
    features:  ['1 brand', '5 competitors', '10 channels', '5 recipients', '1 team seat'],
    cta:       'Upgrade to Starter',
    highlight: false,
  },
  {
    name:      'growth',
    label:     'Growth',
    price:     { INR: '₹2,499', USD: '$49', EUR: '€42' },
    features:  ['3 brands', '10 competitors', '20 channels', '10 recipients', '3 team seats'],
    cta:       'Upgrade to Growth',
    highlight: true,
  },
  {
    name:      'agency',
    label:     'Agency',
    price:     { INR: '₹5,999', USD: '$149', EUR: '€125' },
    features:  ['10 brands', '20 competitors', '50 channels', '20 recipients', '10 team seats'],
    cta:       'Upgrade to Agency',
    highlight: false,
  },
]

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export function UpgradePlanCards({ message }: { message: string | null }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError]            = useState<string | null>(null)

  // Pre-load Razorpay checkout script
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.querySelector('script[src*="razorpay"]')) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.head.appendChild(s)
  }, [])

  async function handleUpgrade(planName: string) {
    setLoadingPlan(planName)
    setError(null)

    try {
      const res = await fetch(`/api/checkout?plan=${planName}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error ?? 'Failed to start checkout. Please try again.')
        return
      }

      const data = await res.json() as {
        gateway:          string
        url?:             string
        subscription_id?: string
        key_id?:          string
        success_url?:     string
      }

      if (data.gateway === 'stripe' && data.url) {
        window.location.href = data.url
        return
      }

      if (data.gateway === 'razorpay' && data.subscription_id && data.key_id) {
        const rzp = new window.Razorpay({
          key:             data.key_id,
          subscription_id: data.subscription_id,
          name:            'Mayil',
          description:     `${planName.charAt(0).toUpperCase() + planName.slice(1)} plan`,
          image:           '/favicon.ico',
          theme:           { color: '#B8922A' },
          handler: () => {
            window.location.href =
              data.success_url ?? '/app/settings/subscription?checkout=success'
          },
        })
        rzp.open()
        return
      }

      setError('Unexpected response from checkout. Please contact support.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16">
      <div className="max-w-3xl w-full flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="font-display text-2xl text-ink">Upgrade your plan</h1>
          <p className="mt-2 text-[13px] text-muted">
            {message
              ? `${message} Upgrade to track more and get deeper intelligence.`
              : 'Get more competitors, channels, and recipients for richer weekly briefs.'}
          </p>
        </div>

        {error && (
          <p className="text-[13px] text-threat text-center">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-3 w-full">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? 'border-gold/40 ring-1 ring-gold/20' : ''}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <div>
                  {plan.highlight && (
                    <span className="label-section text-gold-dark">Most popular</span>
                  )}
                  <p className="font-display text-xl text-ink mt-1">{plan.label}</p>
                  <p className="text-[13px] text-muted mt-0.5">
                    from{' '}
                    <span className="font-mono text-ink font-semibold">{plan.price.INR}</span>
                    /month
                  </p>
                </div>

                <ul className="flex flex-col gap-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-[13px] text-ink">
                      <span className="text-opportunity">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlight ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.name ? 'Loading…' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted">
          <Link href="/app/dashboard" className="hover:text-ink transition-colors">
            ← Back to dashboard
          </Link>
          <span>·</span>
          <Link href="/app/settings/subscription" className="hover:text-ink transition-colors">
            Manage current subscription
          </Link>
        </div>
      </div>
    </div>
  )
}
