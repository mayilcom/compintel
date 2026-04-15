'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLATFORMS, defaultPlatformsFor, buildChannels } from '@/lib/platforms'

const CATEGORIES = ['FMCG', 'Fashion / D2C', 'SaaS / B2B', 'Retail', 'Other']
const MARKETS    = ['B2C', 'B2B', 'Global']

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AE', name: 'UAE' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'OTHER', name: 'Other' },
]

export default function OnboardingBrandPage() {
  const router = useRouter()

  const [brandName, setBrandName]         = useState('')
  const [domain, setDomain]               = useState('')
  const [category, setCategory]           = useState('')
  const [market, setMarket]               = useState('')
  const [country, setCountry]             = useState('')
  const [geoLoading, setGeoLoading]       = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [handles, setHandles]             = useState<Record<string, string>>({})
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  // Auto-detect country from IP on mount
  useEffect(() => {
    fetch('/api/geo/country')
      .then(r => r.json())
      .then((d: { code: string; name: string | null }) => {
        if (d.code) setCountry(d.code)
      })
      .catch(() => null)
      .finally(() => setGeoLoading(false))
  }, [])

  // Auto-select platform defaults when market changes
  useEffect(() => {
    if (market) {
      setSelectedPlatforms(defaultPlatformsFor(market))
    }
  }, [market])

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const canContinue = brandName.trim() && category && market && country

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
          domain:     domain.trim() || null,
          category,
          market,
          country,
          channels:   buildChannels(selectedPlatforms, handles),
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
          We&apos;ll use this to track the right channels and surface relevant signals.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-5">

          {/* Brand name */}
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

          {/* Website domain */}
          <div className="flex flex-col gap-1.5">
            <label className="label-section">Website domain</label>
            <input
              type="text"
              placeholder="e.g. sunfeast.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 transition-shadow"
            />
          </div>

          {/* Category */}
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

          {/* Business type + Country — two columns */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="label-section">Business type *</label>
              <div className="flex gap-2">
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
              <p className="text-[11px] text-muted">
                B2C = consumers · B2B = businesses · Global = both / worldwide
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-section">
                Country of business *
                {geoLoading && (
                  <span className="ml-2 normal-case font-normal text-muted">detecting…</span>
                )}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Channel handles ── */}
          <div className="border-t border-border pt-5 flex flex-col gap-4">
            <div>
              <p className="label-section">
                Channels to track
                <span className="ml-1.5 normal-case font-normal text-muted">(optional — add what you have, edit anytime in Settings)</span>
              </p>
              {market && (
                <p className="mt-1 text-[11px] text-muted">
                  Defaults set for {market}. Toggle to add or remove platforms.
                </p>
              )}
            </div>

            {/* Platform pills */}
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-gold bg-gold-bg text-gold-dark'
                        : 'border-border bg-surface text-muted hover:border-gold hover:text-gold-dark hover:bg-gold-bg'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>

            {/* Handle inputs for selected platforms */}
            {selectedPlatforms.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map((p) => (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-muted font-medium">{p.label}</label>
                    <input
                      type="text"
                      placeholder={p.placeholder}
                      value={handles[p.id] ?? ''}
                      onChange={(e) => setHandles(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-[12px] text-threat">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button onClick={handleContinue} disabled={!canContinue || isLoading}>
              {isLoading ? 'Saving…' : 'Continue →'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
