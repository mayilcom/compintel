'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORMS, buildChannels } from '@/lib/platforms'

interface ConfirmedCompetitor {
  brand_name:   string
  domain:       string | null
  instagram:    string | null
  amazon_brand: string | null
  category:     string | null
  source:       'manual'
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

    // Reset form but keep platform selection
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
          Add brands you want to track. Select the platforms they&apos;re active on and paste their handles or URLs.
        </p>
      </div>

      {/* Add competitor form — always open */}
      <Card className="mb-6">
        <CardContent className="p-5 flex flex-col gap-4">
          <p className="label-section">Add a competitor</p>

          {/* Brand name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-muted font-medium">Brand name *</label>
            <input
              type="text"
              placeholder="e.g. Britannia, Parle, Nestlé…"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && manualName.trim()) addCompetitor() }}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
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
                      <Badge variant="outline" className="text-[10px]">Manual</Badge>
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
