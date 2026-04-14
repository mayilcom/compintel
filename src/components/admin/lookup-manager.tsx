'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface BrandLookupRow {
  id: string
  brand_name: string
  brand_aliases: string[]
  domain: string | null
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  amazon_brand: string | null
  flipkart_brand: string | null
  category: string | null
  market: string
  verified_at: string | null
  source: string
}

const EMPTY_FORM = {
  brand_name: '',
  brand_aliases: '',   // comma-separated input
  domain: '',
  instagram: '',
  youtube: '',
  linkedin: '',
  amazon_brand: '',
  flipkart_brand: '',
  category: '',
  market: 'India',
}

function parseAliases(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export function LookupManager({ initialBrands }: { initialBrands: BrandLookupRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [brands, setBrands] = useState<BrandLookupRow[]>(initialBrands)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = search.trim()
    ? brands.filter(b =>
        b.brand_name.toLowerCase().includes(search.toLowerCase()) ||
        b.brand_aliases.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
        b.domain?.toLowerCase().includes(search.toLowerCase()) ||
        b.instagram?.toLowerCase().includes(search.toLowerCase())
      )
    : brands

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowAddForm(true)
    setError(null)
  }

  function openEdit(brand: BrandLookupRow) {
    setForm({
      brand_name:    brand.brand_name,
      brand_aliases: brand.brand_aliases.join(', '),
      domain:        brand.domain ?? '',
      instagram:     brand.instagram ?? '',
      youtube:       brand.youtube ?? '',
      linkedin:      brand.linkedin ?? '',
      amazon_brand:  brand.amazon_brand ?? '',
      flipkart_brand: brand.flipkart_brand ?? '',
      category:      brand.category ?? '',
      market:        brand.market,
    })
    setEditingId(brand.id)
    setShowAddForm(true)
    setError(null)
  }

  function cancelForm() {
    setShowAddForm(false)
    setEditingId(null)
    setError(null)
  }

  async function handleSave() {
    if (!form.brand_name.trim()) { setError('Brand name is required'); return }
    setSaving(true)
    setError(null)

    const payload = {
      brand_name:    form.brand_name.trim(),
      brand_aliases: parseAliases(form.brand_aliases),
      domain:        form.domain.trim() || null,
      instagram:     form.instagram.trim() || null,
      youtube:       form.youtube.trim() || null,
      linkedin:      form.linkedin.trim() || null,
      amazon_brand:  form.amazon_brand.trim() || null,
      flipkart_brand: form.flipkart_brand.trim() || null,
      category:      form.category.trim() || null,
      market:        form.market,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/lookup/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Update failed'); return }
        const updated: BrandLookupRow = await res.json()
        setBrands(prev => prev.map(b => b.id === editingId ? updated : b))
      } else {
        const res = await fetch('/api/admin/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Create failed'); return }
        const created: BrandLookupRow = await res.json()
        setBrands(prev => [created, ...prev])
      }
      setShowAddForm(false)
      setEditingId(null)
      startTransition(() => router.refresh())
    } catch {
      setError('Network error — try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}" from brand lookup? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/lookup/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Delete failed'); return }
    setBrands(prev => prev.filter(b => b.id !== id))
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-ink">Brand lookup</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Powers competitor auto-discovery in onboarding. {brands.length} brand{brands.length !== 1 ? 's' : ''} indexed.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add brand</Button>
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search brands, aliases, or handles..."
        className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 max-w-sm"
      />

      {/* Add / Edit form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-5 flex flex-col gap-4">
            <p className="label-section">{editingId ? 'Edit brand' : 'New brand'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="label-section">Brand name *</label>
                <input value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-section">Aliases (comma-separated)</label>
                <input value={form.brand_aliases} onChange={e => setForm(f => ({ ...f, brand_aliases: e.target.value }))}
                  placeholder="Britannia, BIL"
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-section">Domain</label>
                <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="britannia.co.in"
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-section">Instagram handle</label>
                <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                  placeholder="britanniaindustries"
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-section">Amazon brand name</label>
                <input value={form.amazon_brand} onChange={e => setForm(f => ({ ...f, amazon_brand: e.target.value }))}
                  placeholder="Britannia"
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label-section">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">— Select —</option>
                  {['FMCG', 'SaaS', 'Retail', 'Fashion', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-[13px] text-threat">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelForm} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add brand'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              {search ? `No brands matching "${search}".` : 'No brands in lookup table yet.'}
            </p>
          )}
          {filtered.map((brand) => (
            <div
              key={brand.id}
              className="flex items-start justify-between px-5 py-4 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium text-ink">{brand.brand_name}</p>
                  {brand.category && (
                    <Badge variant="default" className="text-[10px]">{brand.category}</Badge>
                  )}
                  {brand.verified_at && (
                    <span className="text-[10px] text-opportunity font-mono">✓ verified</span>
                  )}
                </div>
                {brand.brand_aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {brand.brand_aliases.map((alias) => (
                      <span key={alias} className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] text-muted">
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-[11px] text-muted">
                  {brand.domain    && <span className="font-mono">{brand.domain}</span>}
                  {brand.instagram && <span>@{brand.instagram}</span>}
                  {brand.amazon_brand && <span>Amazon: {brand.amazon_brand}</span>}
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => openEdit(brand)}
                  className="text-[11px] text-muted hover:text-ink transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(brand.id, brand.brand_name)}
                  className="text-[11px] text-muted hover:text-threat transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
