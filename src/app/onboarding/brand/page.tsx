'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['FMCG', 'Fashion / D2C', 'SaaS / B2B', 'Retail', 'Other']
const MARKETS    = ['India B2C', 'India B2B', 'International']

/** Strip URL boilerplate and @ so we store only the raw handle */
function extractHandle(input: string, platform: 'instagram' | 'linkedin' | 'youtube' | 'facebook'): string {
  const s = input.trim()
  if (!s) return ''
  // Pull the path segment after the domain, e.g. instagram.com/handle → handle
  const patterns: Record<string, RegExp> = {
    instagram: /(?:instagram\.com\/)([A-Za-z0-9_.]+)/,
    linkedin:  /(?:linkedin\.com\/company\/)([A-Za-z0-9_-]+)/,
    youtube:   /(?:youtube\.com\/(?:@|c\/|channel\/|user\/))([A-Za-z0-9_.-]+)/,
    facebook:  /(?:facebook\.com\/)([A-Za-z0-9_.]+)/,
  }
  const match = s.match(patterns[platform])
  if (match) return match[1]
  // Already a plain handle or @handle
  return s.replace(/^@/, '').split('/')[0]
}

export default function OnboardingBrandPage() {
  const router = useRouter()

  const [brandName, setBrandName]         = useState('')
  const [domain, setDomain]               = useState('')
  const [category, setCategory]           = useState('')
  const [market, setMarket]               = useState('')
  // Channel handles
  const [instagram, setInstagram]         = useState('')
  const [youtube, setYoutube]             = useState('')
  const [linkedin, setLinkedin]           = useState('')
  const [facebook, setFacebook]           = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const canContinue = brandName.trim() && category && market

  // Build channels object for saving
  function buildChannels() {
    const ch: Record<string, { handle?: string; url?: string }> = {}
    const ig = extractHandle(instagram, 'instagram')
    const yt = extractHandle(youtube, 'youtube')
    const li = extractHandle(linkedin, 'linkedin')
    const fb = extractHandle(facebook, 'facebook')
    if (ig) ch.instagram = { handle: ig }
    if (yt) ch.youtube   = { handle: yt }
    if (li) ch.linkedin  = { handle: li }
    if (fb) ch.meta_ads  = { handle: fb }
    return ch
  }

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
          channels: buildChannels(),
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

          {/* ── Channel handles ── */}
          <div className="border-t border-border pt-5 flex flex-col gap-4">
            <div>
              <p className="label-section">Channel handles <span className="normal-case font-normal text-muted">(optional — paste handle or full URL)</span></p>
              <p className="mt-1 text-[11px] text-muted">
                We use these to collect your own brand&apos;s data each week. Add what you have now; edit anytime in Settings.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">Instagram</label>
                <input
                  type="text"
                  placeholder="@yourbrand or instagram.com/…"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">YouTube</label>
                <input
                  type="text"
                  placeholder="youtube.com/@yourchannel"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">LinkedIn company</label>
                <input
                  type="text"
                  placeholder="linkedin.com/company/…"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">Facebook page</label>
                <input
                  type="text"
                  placeholder="facebook.com/yourbrand"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
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
