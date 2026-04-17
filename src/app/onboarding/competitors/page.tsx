'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORMS, buildChannels } from '@/lib/platforms'

interface BrandResult {
  id:           string
  brand_name:   string
  brand_aliases: string[] | null
  domain:       string | null
  instagram:    string | null
  amazon_brand: string | null
  category:     string | null
}

interface ConfirmedCompetitor {
  brand_name:   string
  domain:       string | null
  instagram:    string | null
  amazon_brand: string | null
  category:     string | null
  source:       'manual' | 'lookup'
  channels:     Record<string, { handle?: string; brand_name?: string }>
}

export default function OnboardingCompetitorsPage() {
  const router = useRouter()

  const [confirmed, setConfirmed]         = useState<ConfirmedCompetitor[]>([])
  const [manualName, setManualName]       = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'youtube'])
  const [handles, setHandles]             = useState<Record<string, string>>({})
  const [isSaving, setIsSaving]           = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  // Search state
  const [searchResults, setSearchResults] = useState<BrandResult[]>([])
  const [showDropdown, setShowDropdown]   = useState(false)
  const [isSearching, setIsSearching]     = useState(false)
  const searchTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef                       = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    const q = manualName.trim()
    if (q.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/onboarding/competitors/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json() as { brands: BrandResult[] }
          setSearchResults(data.brands ?? [])
          setShowDropdown((data.brands ?? []).length > 0)
        }
      } catch {
        // silent — user can still type manually
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [manualName])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectFromLookup(brand: BrandResult) {
    setShowDropdown(false)

    // Determine which platforms have data
    const activePlatforms: string[] = []
    const newHandles: Record<string, string> = {}

    if (brand.instagram) {
      activePlatforms.push('instagram')
      newHandles['instagram'] = brand.instagram
    }
    if (brand.amazon_brand) {
      activePlatforms.push('amazon')
      newHandles['amazon'] = brand.amazon_brand
    }
    if (brand.domain) {
      activePlatforms.push('google_search')
      newHandles['google_search'] = brand.domain
    }

    // Keep at least default platforms if nothing found
    if (activePlatforms.length === 0) {
      activePlatforms.push('instagram', 'youtube')
    }

    setManualName(brand.brand_name)
    setSelectedPlatforms(activePlatforms)
    setHandles(newHandles)

    // Auto-add immediately if all data present
    const channels = buildChannels(activePlatforms, newHandles)
    if (confirmed.some(c => c.brand_name.toLowerCase() === brand.brand_name.toLowerCase())) return

    setConfirmed(prev => [...prev, {
      brand_name:   brand.brand_name,
      domain:       brand.domain,
      instagram:    brand.instagram,
      amazon_brand: brand.amazon_brand,
      category:     brand.category,
      source:       'lookup',
      channels,
    }])

    setManualName('')
    setHandles({})
    setSelectedPlatforms(['instagram', 'youtube'])
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function addCompetitor() {
    const name = manualName.trim()
    if (!name) return
    if (confirmed.some(c => c.brand_name.toLowerCase() === name.toLowerCase())) return

    const channels = buildChannels(selectedPlatforms, handles)

    setConfirmed(prev => [...prev, {
      brand_name:   name,
      domain:       null,
      instagram:    channels.instagram?.handle ?? null,
      amazon_brand: channels.amazon?.brand_name ?? null,
      category:     null,
      source:       'manual',
      channels,
    }])

    setManualName('')
    setHandles({})
  }

  function removeConfirmed(name: string) {
    setConfirmed(prev => prev.filter(c => c.brand_name !== name))
  }

  function getChannelSummary(channels: Record<string, { handle?: string; brand_name?: string }>): string {
    return Object.entries(channels)
      .map(([key, val]) => {
        const platform = PLATFORMS.find(p => p.channelKey === key)
        const value    = val.handle ?? val.brand_name ?? ''
        return platform ? `${platform.label}: ${value}` : null
      })
      .filter(Boolean)
      .join(' · ')
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
              channels:     c.channels,
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
          Search for brands you want to track, or add them manually with platform handles.
        </p>
      </div>

      {/* Add competitor form */}
      <Card className="mb-6">
        <CardContent className="p-5 flex flex-col gap-4">
          <p className="label-section">Add a competitor</p>

          {/* Brand name with search dropdown */}
          <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <label className="text-[11px] text-muted font-medium">Brand name *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search brand name…"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowDropdown(false)
                  if (e.key === 'Enter' && !showDropdown && manualName.trim()) addCompetitor()
                }}
                className="h-9 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                  searching…
                </span>
              )}
            </div>

            {/* Search dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-[8px] border border-border bg-surface shadow-card overflow-hidden">
                {searchResults.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectFromLookup(brand) }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span className="text-sm text-ink font-medium">{brand.brand_name}</span>
                    <div className="flex items-center gap-2">
                      {brand.category && (
                        <span className="text-[10px] text-muted">{brand.category}</span>
                      )}
                      {brand.instagram && (
                        <span className="text-[10px] bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">IG</span>
                      )}
                      {brand.amazon_brand && (
                        <span className="text-[10px] bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">AMZ</span>
                      )}
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 border-t border-border bg-surface-2">
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setShowDropdown(false) }}
                    className="text-[11px] text-muted hover:text-ink"
                  >
                    Add &ldquo;{manualName}&rdquo; manually instead
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Platform picker */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-muted font-medium">Platforms to track</label>
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

          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={addCompetitor}
              disabled={!manualName.trim()}
            >
              Add competitor +
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Added competitors list */}
      {confirmed.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <p className="label-section">Added ({confirmed.length})</p>
          {confirmed.map((comp) => (
            <Card key={comp.brand_name} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{comp.brand_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {comp.source === 'lookup' ? 'From library' : 'Manual'}
                      </Badge>
                      {comp.category && (
                        <span className="text-[10px] text-muted">{comp.category}</span>
                      )}
                    </div>
                    {Object.keys(comp.channels).length > 0 && (
                      <p className="text-[11px] text-muted truncate">
                        {getChannelSummary(comp.channels)}
                      </p>
                    )}
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
