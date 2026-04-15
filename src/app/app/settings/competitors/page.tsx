'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORMS, parseChannels, buildChannels, defaultPlatformsFor } from '@/lib/platforms'
import type { DbBrand } from '@/lib/types'

type Brand = DbBrand

/** Inline edit form for a single brand's channels */
function ChannelEditor({
  brand,
  onSave,
  onCancel,
}: {
  brand: Brand
  onSave: (selectedPlatforms: string[], handles: Record<string, string>) => Promise<void>
  onCancel: () => void
}) {
  const initial = parseChannels(brand.channels)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    PLATFORMS.filter(p => initial[p.id] !== undefined).map(p => p.id)
  )
  const [handles, setHandles] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    setSaving(true)
    await onSave(selectedPlatforms, handles)
    setSaving(false)
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-[11px] text-muted font-medium">Platforms</p>
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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save channels'}
        </Button>
      </div>
    </div>
  )
}

/** Summary line of current channels */
function ChannelSummary({ channels }: { channels: Brand['channels'] }) {
  if (!channels || Object.keys(channels).length === 0) {
    return <span className="text-[11px] text-muted italic">No channels set</span>
  }
  const parts = Object.entries(channels).map(([key, val]) => {
    const platform = PLATFORMS.find(p => p.channelKey === key)
    const value    = val.handle ?? val.brand_name ?? ''
    return platform ? `${platform.label}: ${value}` : null
  }).filter(Boolean)
  return <span className="text-[11px] text-muted">{parts.join(' · ')}</span>
}

export default function CompetitorsSettingsPage() {
  const [brands, setBrands]         = useState<Brand[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Add competitor form
  const [showAdd, setShowAdd]                   = useState(false)
  const [newName, setNewName]                   = useState('')
  const [newSelectedPlatforms, setNewSelected]  = useState<string[]>(['instagram', 'youtube'])
  const [newHandles, setNewHandles]             = useState<Record<string, string>>({})
  const [isAdding, setIsAdding]                 = useState(false)
  const [addError, setAddError]                 = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/brands')
      .then(r => r.json())
      .then((d: { brands: Brand[] }) => setBrands(d.brands))
      .catch(() => null)
      .finally(() => setIsLoading(false))
  }, [])

  const clientBrand    = brands.find(b => b.is_client)
  const competitors    = brands.filter(b => !b.is_client)

  async function handleSaveChannels(brandId: string, selectedPlatforms: string[], handles: Record<string, string>) {
    const res = await fetch(`/api/settings/brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedPlatforms, handles }),
    })
    if (res.ok) {
      const updated = await res.json() as Brand
      setBrands(prev => prev.map(b => b.brand_id === brandId ? updated : b))
      setEditingId(null)
    }
  }

  async function handleDelete(brandId: string) {
    setDeleteError(null)
    const res = await fetch(`/api/settings/brands/${brandId}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setBrands(prev => prev.filter(b => b.brand_id !== brandId))
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setDeleteError(body.error ?? 'Failed to remove competitor')
    }
  }

  function toggleNewPlatform(id: string) {
    setNewSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleAddCompetitor() {
    const name = newName.trim()
    if (!name) return
    setIsAdding(true)
    setAddError(null)

    const channels = buildChannels(newSelectedPlatforms, newHandles)
    const res = await fetch('/api/onboarding/competitors/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitors: [{
          brand_name:   name,
          domain:       null,
          instagram:    channels.instagram?.handle ?? null,
          amazon_brand: channels.amazon?.brand_name ?? null,
          category:     null,
          channels,
        }],
      }),
    })

    if (res.ok) {
      // Reload brands list
      const fresh = await fetch('/api/settings/brands').then(r => r.json()) as { brands: Brand[] }
      setBrands(fresh.brands)
      setNewName('')
      setNewHandles({})
      setNewSelected(['instagram', 'youtube'])
      setShowAdd(false)
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setAddError(body.error ?? 'Failed to add competitor')
    }
    setIsAdding(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-display text-xl text-ink">Brands &amp; competitors</h1>
        <p className="mt-1 text-[13px] text-muted">
          Manage the channels tracked for your brand and each competitor.
        </p>
      </div>

      {/* ── Your brand ── */}
      <div className="flex flex-col gap-2">
        <p className="label-section">Your brand</p>
        {isLoading ? (
          <Card><div className="py-8 text-center text-[13px] text-muted">Loading…</div></Card>
        ) : !clientBrand ? (
          <Card><div className="py-8 text-center text-[13px] text-muted">No brand found.</div></Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{clientBrand.brand_name}</span>
                    <Badge variant="default" className="text-[10px]">Your brand</Badge>
                  </div>
                  {clientBrand.domain && (
                    <span className="text-[11px] text-muted font-mono">{clientBrand.domain}</span>
                  )}
                  <ChannelSummary channels={clientBrand.channels} />
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === clientBrand.brand_id ? null : clientBrand.brand_id)}
                  className="text-[11px] text-gold hover:text-gold-dark transition-colors shrink-0"
                >
                  {editingId === clientBrand.brand_id ? 'Cancel' : 'Edit channels'}
                </button>
              </div>

              {editingId === clientBrand.brand_id && (
                <ChannelEditor
                  brand={clientBrand}
                  onSave={(sp, h) => handleSaveChannels(clientBrand.brand_id, sp, h)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Competitors ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="label-section">Competitors ({competitors.length})</p>
          <button
            type="button"
            onClick={() => { setShowAdd(v => !v); setAddError(null) }}
            className="text-[11px] text-gold hover:text-gold-dark font-medium transition-colors"
          >
            {showAdd ? 'Cancel' : '+ Add competitor'}
          </button>
        </div>

        {/* Add competitor form */}
        {showAdd && (
          <Card>
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted font-medium">Brand name *</label>
                <input
                  type="text"
                  placeholder="e.g. Britannia"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-muted font-medium">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const isSelected = newSelectedPlatforms.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleNewPlatform(p.id)}
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

              {newSelectedPlatforms.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {PLATFORMS.filter(p => newSelectedPlatforms.includes(p.id)).map((p) => (
                    <div key={p.id} className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-muted font-medium">{p.label}</label>
                      <input
                        type="text"
                        placeholder={p.placeholder}
                        value={newHandles[p.id] ?? ''}
                        onChange={(e) => setNewHandles(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                      />
                    </div>
                  ))}
                </div>
              )}

              {addError && <p className="text-[12px] text-threat">{addError}</p>}

              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddCompetitor} disabled={isAdding || !newName.trim()}>
                  {isAdding ? 'Adding…' : 'Add competitor'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitors list */}
        {isLoading ? (
          <Card><div className="py-8 text-center text-[13px] text-muted">Loading…</div></Card>
        ) : competitors.length === 0 && !showAdd ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-ink">No competitors added yet</p>
              <p className="text-[13px] text-muted mt-1">
                Add competitors to start tracking their channels in your weekly brief.
              </p>
            </div>
          </Card>
        ) : (
          competitors.map((comp) => (
            <Card key={comp.brand_id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{comp.brand_name}</span>
                      {comp.is_paused && (
                        <Badge variant="outline" className="text-[10px] text-muted">Paused</Badge>
                      )}
                    </div>
                    {comp.domain && (
                      <span className="text-[11px] text-muted font-mono">{comp.domain}</span>
                    )}
                    <ChannelSummary channels={comp.channels} />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === comp.brand_id ? null : comp.brand_id)}
                      className="text-[11px] text-gold hover:text-gold-dark transition-colors"
                    >
                      {editingId === comp.brand_id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comp.brand_id)}
                      className="text-[11px] text-muted hover:text-threat transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {editingId === comp.brand_id && (
                  <ChannelEditor
                    brand={comp}
                    onSave={(sp, h) => handleSaveChannels(comp.brand_id, sp, h)}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}

        {deleteError && <p className="text-[12px] text-threat">{deleteError}</p>}
      </div>
    </div>
  )
}
