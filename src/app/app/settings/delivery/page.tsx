'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DeliveryState {
  delivery_paused:     boolean
  skip_next_delivery:  boolean
  paused_at:           string | null
  next_delivery:       string
}

export default function DeliverySettingsPage() {
  const [state, setState]     = useState<DeliveryState | null>(null)
  const [loading, setLoading] = useState('')
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/delivery')
      .then(r => r.json())
      .then((d: DeliveryState) => setState(d))
      .catch(() => null)
  }, [])

  async function callAction(action: 'skip' | 'pause' | 'resume') {
    setLoading(action)
    setError(null)

    const res = await fetch('/api/settings/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (res.ok) {
      const data = await res.json() as Record<string, unknown>
      setState(prev => prev ? {
        ...prev,
        skip_next_delivery: action === 'skip'
          ? (data.skip_next_delivery as boolean)
          : prev.skip_next_delivery,
        delivery_paused: action === 'pause'
          ? true
          : action === 'resume'
          ? false
          : prev.delivery_paused,
      } : prev)
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Action failed')
    }
    setLoading('')
  }

  const isPaused = state?.delivery_paused ?? false
  const isSkipped = state?.skip_next_delivery ?? false

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Delivery preferences</h1>
        <p className="mt-1 text-[13px] text-muted">
          Control when and how your brief is delivered.
        </p>
      </div>

      {/* Delivery schedule */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-section mb-1">Delivery schedule</p>
              <p className="text-sm font-medium text-ink">Sunday 7:00am IST</p>
              {state && (
                <p className="text-[13px] text-muted">
                  {isPaused
                    ? 'Deliveries paused'
                    : isSkipped
                    ? `Next delivery skipped · resumes ${state.next_delivery}`
                    : `Next delivery: ${state.next_delivery}`}
                </p>
              )}
            </div>
            {isPaused && (
              <span className="rounded-full bg-surface-2 border border-border px-2.5 py-1 text-[10px] font-medium text-muted">
                Paused
              </span>
            )}
          </div>

          {error && <p className="text-[12px] text-threat">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-border">
            {!isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => callAction('skip')}
                disabled={!!loading}
              >
                {loading === 'skip'
                  ? '…'
                  : isSkipped
                  ? 'Undo skip'
                  : 'Skip next delivery'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => callAction(isPaused ? 'resume' : 'pause')}
              disabled={!!loading}
            >
              {loading === 'pause' || loading === 'resume'
                ? '…'
                : isPaused
                ? 'Resume deliveries'
                : 'Pause all deliveries'}
            </Button>
          </div>
          <p className="text-[11px] text-muted">
            Skip is available once per month. Paused briefs are archived, not deleted.
            Collection continues while paused.
          </p>
        </CardContent>
      </Card>

      {/* Custom domain sending */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-3">
          <div>
            <p className="label-section mb-1">Sending domain</p>
            <p className="text-[13px] text-muted">
              Currently sending from:{' '}
              <span className="font-mono text-ink">briefs@emayil.com</span>
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-surface-2 px-4 py-3">
            <p className="text-[13px] font-medium text-ink">Send from your own domain</p>
            <p className="text-[13px] text-muted mt-1">
              Send briefs from{' '}
              <span className="font-mono">intelligence@yourcompany.com</span>. Requires DNS
              verification (SPF + DKIM). Available on Growth and Agency.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Set up custom domain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts — Coming soon */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-section mb-1">Triggered alerts</p>
              <p className="text-[13px] text-muted">
                Get an immediate email when a significant competitor event is detected —
                funding news, activity spikes, or new ad campaigns.
              </p>
            </div>
            <span className="rounded-full bg-surface-2 border border-border px-2.5 py-1 text-[10px] font-medium text-muted shrink-0">
              Coming soon
            </span>
          </div>
          <div className="flex flex-col gap-2 opacity-50 pointer-events-none">
            <div className="flex items-center justify-between py-2 border-t border-border">
              <span className="text-[13px] text-ink">Email alerts</span>
              <div className="h-5 w-9 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-ink">WhatsApp alerts</span>
              <div className="h-5 w-9 rounded-full bg-border" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
