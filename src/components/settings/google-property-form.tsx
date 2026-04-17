'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  ga4PropertyId:  string | null
  gscSiteUrl:     string | null
}

export function GooglePropertyForm({ ga4PropertyId, gscSiteUrl }: Props) {
  const [ga4,    setGa4]    = useState(ga4PropertyId  ?? '')
  const [gsc,    setGsc]    = useState(gscSiteUrl     ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error,  setError]  = useState('')

  async function save() {
    setStatus('saving')
    setError('')
    const res = await fetch('/api/settings/channels/google-properties', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ga4_property_id: ga4.trim() || null, gsc_site_url: gsc.trim() || null }),
    })
    if (res.ok) {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Failed to save. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-border">
      <p className="text-[11px] text-muted font-medium uppercase tracking-widest">Property config</p>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted">GA4 Property ID</label>
        <input
          type="text"
          placeholder="e.g. 123456789"
          value={ga4}
          onChange={e => setGa4(e.target.value)}
          className="h-8 rounded-[6px] border border-border bg-surface px-3 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <p className="text-[10px] text-muted">Found in GA4 → Admin → Property Settings → Property ID</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted">Search Console site URL</label>
        <input
          type="text"
          placeholder="e.g. https://yourdomain.com/"
          value={gsc}
          onChange={e => setGsc(e.target.value)}
          className="h-8 rounded-[6px] border border-border bg-surface px-3 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <p className="text-[10px] text-muted">Exact URL as it appears in Google Search Console</p>
      </div>

      {status === 'error' && <p className="text-[11px] text-threat">{error}</p>}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={save}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
