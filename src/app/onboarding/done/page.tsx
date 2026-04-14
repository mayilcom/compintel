'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'

const TIMELINE = [
  { day: 'Today',        event: 'First data collection begins (accelerated for new accounts)' },
  { day: 'Day 3',        event: 'Collection complete. Analysis and signal detection run.' },
  { day: 'Day 7',        event: 'Your first brief arrives — your competitive baseline, week 1.' },
  { day: 'Day 14',       event: 'Second brief. First deltas, first signals, first implications.' },
  { day: 'Every Sunday', event: '7:00am IST. Your inbox. No login required.' },
]

export default function OnboardingDonePage() {
  // Mark onboarding complete exactly once
  useEffect(() => {
    fetch('/api/onboarding/complete', { method: 'POST' }).catch(() => null)
  }, [])

  return (
    <div>
      <OnboardingProgress currentStep={5} />

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-bg border border-gold/30">
          <span className="text-xl">✓</span>
        </div>
        <h1 className="font-display text-2xl text-ink">You&apos;re all set</h1>
        <p className="mt-2 text-[13px] text-muted max-w-sm mx-auto">
          Mayil is collecting data. Your first brief arrives in 7 days.
          Here&apos;s what happens next.
        </p>
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="label-section mb-4">What happens next</p>
          <div className="flex flex-col gap-0">
            {TIMELINE.map((item, i) => (
              <div key={item.day} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${i === 0 ? 'bg-gold' : 'bg-border'}`} />
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 bg-border my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-semibold text-ink">{item.day}</p>
                  <p className="text-[13px] text-muted mt-0.5">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Closing question preview */}
      <Card className="mb-8 border-border bg-surface-2">
        <CardContent className="p-4">
          <p className="label-section mb-2">Your first closing question</p>
          <p className="text-[13px] text-muted italic">
            &ldquo;Now that you can see where every competitor stands today — which one concerns you most, and why?&rdquo;
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Link href="/app/dashboard">
          <Button size="lg">Go to dashboard →</Button>
        </Link>
        <p className="text-xs text-muted">
          You can add more competitors and recipients anytime from Settings.
        </p>
      </div>
    </div>
  )
}
