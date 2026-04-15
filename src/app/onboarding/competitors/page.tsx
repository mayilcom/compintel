'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  brand_name: string
  brand_aliases: string[] | null
  domain: string | null
  instagram: string | null
  amazon_brand: string | null
  category: string | null
}

interface ConfirmedCompetitor {
  brand_name: string
  domain: string | null
  instagram: string | null
  amazon_brand: string | null
  category: string | null
  source: 'lookup' | 'manual'
  channels?: Record<string, { handle?: string; url?: string }>
}

export default function OnboardingCompetitorsPage() {
  const router = useRouter()

  const [query, setQuery]                         = useState('')
  const [results, setResults]                     = useState<SearchResult[]>([])
  const [isSearching, setIsSearching]             = useState(false)
  const [confirmed, setConfirmed]                 = useState<ConfirmedCompetitor[]>([])
  const [showManual, setShowManual]               = useState(false)
  const [manualName, setManualName]               = useState('')
  const [manualInstagram, setManualInstagram]     = useState('')
  const [manualYoutube, setManualYoutube]         = useState('')
  const [manualLinkedin, setManualLinkedin]       = useState('')
  const [isSaving, setIsSaving]                   = useState(false)
  const [error, setError]                         = useState<string | null>(null)

  function extractHandle(input: string, platform: 'instagram' | 'linkedin' | 'youtube'): string {
    const s = input.trim()
    if (!s) return ''
    const patterns: Record<string, RegExp> = {
      instagram: /(?:instagram\.com\/)([A-Za-z0-9_.]+)/,
      linkedin:  /(?:linkedin\.com\/company\/)([A-Za-z0-9_-]+)/,
      youtube:   /(?:youtube\.com\/(?:@|c\/|channel\/|user\/))([A-Za-z0-9_.-]+)/,
    }
    const match = s.match(patterns[platform])
    if (match) return match[1]
    return s.replace(/^@/, '').split('/')[0]
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/onboarding/competitors/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json() as SearchResult[]
          // Filter out already-confirmed brands
          const confirmedNames = new Set(confirmed.map(c => c.brand_name.toLowerCase()))
          setResults(data.filter(r => !confirmedNames.has(r.brand_name.toLowerCase())))
        }
      } catch {
        // silently ignore search errors
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function confirmResult(r: SearchResult) {
    setConfirmed(prev => [...prev, {
      brand_name:   r.brand_name,
      domain:       r.domain,
      instagram:    r.instagram,
      amazon_brand: r.amazon_brand,
      category:     r.category,
      source:       'lookup',
    }])
    setResults(prev => prev.filter(x => x.id !== r.id))
    setQuery('')
  }

  function removeConfirmed(name: string) {
    setConfirmed(prev => prev.filter(c => c.brand_name !== name))
  }

  function addManual() {
    const name = manualName.trim()
    if (!name) return

    if (confirmed.some(c => c.brand_name.toLowerCase() === name.toLowerCase())) return

    const ig = extractHandle(manualInstagram, 'instagram')
    const yt = extractHandle(manualYoutube,   'youtube')
    const li = extractHandle(manualLinkedin,  'linkedin')

    setConfirmed(prev => [...prev, {
      brand_name:   name,
      domain:       null,
      instagram:    ig || null,
      amazon_brand: null,
      category:     null,
      source:       'manual',
      channels: {
        ...(ig ? { instagram: { handle: ig } } : {}),
        ...(yt ? { youtube:   { handle: yt } } : {}),
        ...(li ? { linkedin:  { handle: li } } : {}),
      },
    }])
    setManualName('')
    setManualInstagram('')
    setManualYoutube('')
    setManualLinkedin('')
    setShowManual(false)
  }

  async function handleContinue() {
    setIsSaving(true)
    setError(null)

    try {
      if (confirmed.length > 0) {
        const res = await fetch('/api/onboarding/competitors/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitors: confirmed.map(c => ({
              brand_name:   c.brand_name,
              domain:       c.domain,
              instagram:    c.instagram,
              amazon_brand: c.amazon_brand,
              category:     c.category,
              channels:     c.channels ?? {},
            })),
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError((body as { error?: string }).error ?? 'Failed to save competitors. Please try again.')
          return
        }
      }

      router.push('/onboarding/channels')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <OnboardingProgress currentStep={2} />

      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Add your competitors</h1>
        <p className="mt-2 text-[13px] text-muted">
          Enter a brand name or domain. We&apos;ll find their channels automatically.
          You confirm every handle before tracking begins — no silent assumptions.
        </p>
      </div>

      {/* Search input */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search brand name (e.g. Britannia, Parle…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">
                Searching…
              </span>
            )}
          </div>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-[8px] border border-border bg-surface px-3 py-2.5 hover:border-gold/40 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-ink">{r.brand_name}</span>
                    <div className="flex items-center gap-2">
                      {r.domain && (
                        <span className="text-[11px] text-muted font-mono">{r.domain}</span>
                      )}
                      {r.instagram && (
                        <span className="text-[11px] text-muted">{r.instagram}</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => confirmResult(r)}>
                    Add +
                  </Button>
                </div>
              ))}
            </div>
          )}

          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <p className="mt-2 text-[12px] text-muted">
              No matches found.{' '}
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="text-gold hover:text-gold-dark font-medium transition-colors"
              >
                Add manually
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmed competitors */}
      {confirmed.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <p className="label-section">Added competitors ({confirmed.length})</p>
          {confirmed.map((comp) => (
            <Card key={comp.brand_name} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{comp.brand_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {comp.source === 'lookup' ? 'Verified lookup' : 'Manual'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {comp.domain && (
                        <span className="text-[11px] text-muted font-mono">{comp.domain}</span>
                      )}
                      {comp.instagram && (
                        <span className="text-[11px] text-muted">{comp.instagram}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeConfirmed(comp.brand_name)}
                    className="text-[11px] text-muted hover:text-threat transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manual add */}
      {!showManual ? (
        <p className="text-[13px] text-muted mb-1">
          Can&apos;t find a competitor?{' '}
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-gold hover:text-gold-dark transition-colors font-medium"
          >
            Add manually
          </button>
        </p>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-col gap-3">
            <p className="label-section">Add competitor manually</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted font-medium">Brand name *</label>
              <input
                type="text"
                placeholder="e.g. Britannia"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">Instagram</label>
                <input
                  type="text"
                  placeholder="@handle or URL"
                  value={manualInstagram}
                  onChange={(e) => setManualInstagram(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">YouTube</label>
                <input
                  type="text"
                  placeholder="youtube.com/@…"
                  value={manualYoutube}
                  onChange={(e) => setManualYoutube(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">LinkedIn</label>
                <input
                  type="text"
                  placeholder="linkedin.com/company/…"
                  value={manualLinkedin}
                  onChange={(e) => setManualLinkedin(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowManual(false)
                  setManualName('')
                  setManualInstagram('')
                  setManualYoutube('')
                  setManualLinkedin('')
                }}
              >
                Cancel
              </Button>
              <Button variant="outline" size="sm" onClick={addManual} disabled={!manualName.trim()}>
                Add competitor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="mt-4 text-[12px] text-threat">{error}</p>
      )}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="ghost" asChild>
          <a href="/onboarding/brand">← Back</a>
        </Button>
        <Button onClick={handleContinue} disabled={isSaving}>
          {isSaving ? 'Saving…' : confirmed.length > 0 ? `Continue with ${confirmed.length} competitor${confirmed.length !== 1 ? 's' : ''} →` : 'Skip for now →'}
        </Button>
      </div>
    </div>
  )
}
