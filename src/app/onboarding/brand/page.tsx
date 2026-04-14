'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['FMCG', 'Fashion / D2C', 'SaaS / B2B', 'Retail', 'Other']
const MARKETS    = ['India B2C', 'India B2B', 'International']

export default function OnboardingBrandPage() {
  const router = useRouter()

  const [brandName, setBrandName]         = useState('')
  const [domain, setDomain]               = useState('')
  const [category, setCategory]           = useState('')
  const [market, setMarket]               = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const canContinue = brandName.trim() && category && market

  async function handleContinue() {
    if (!canContinue) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          domain: domain.trim() || null,
          category,
          market,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push('/onboarding/competitors')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <OnboardingProgress currentStep={1} />

      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Tell us about your brand</h1>
        <p className="mt-2 text-[13px] text-muted">
          We&apos;ll auto-discover your public channel handles. You confirm them before tracking begins.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Brand name *</label>
            <input
              type="text"
              placeholder="e.g. Sunfeast"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Website domain</label>
            <input
              type="text"
              placeholder="e.g. sunfeast.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 transition-shadow"
            />
            <p className="text-[11px] text-muted">
              Helps us find your Instagram, YouTube, and LinkedIn handles automatically.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Category *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === cat
                      ? 'border-gold bg-gold-bg text-gold-dark'
                      : 'border-border bg-surface text-muted hover:border-gold hover:text-gold-dark hover:bg-gold-bg'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Market *</label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    market === m
                      ? 'border-gold bg-gold-bg text-gold-dark'
                      : 'border-border bg-surface text-muted hover:border-gold hover:text-gold-dark hover:bg-gold-bg'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-threat">{error}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
            >
              {isLoading ? 'Saving…' : 'Continue →'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
