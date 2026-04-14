'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UpgradeModal } from '@/components/upgrade-modal'
import { type Plan } from '@/lib/utils'

interface Recipient {
  recipient_id: string
  name:         string
  email:        string
  brief_variant: string
  active:       boolean
}

const VARIANT_LABELS: Record<string, string> = {
  full:             'Full brief',
  channel_focus:    'Channel focus',
  executive_digest: 'Executive digest',
}

export default function RecipientsSettingsPage() {
  const router = useRouter()

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [plan, setPlan]             = useState<Plan>('trial')
  const [limit, setLimit]           = useState(2)
  const [isLoading, setIsLoading]   = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [variant, setVariant] = useState('full')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/recipients')
      .then(r => r.json())
      .then((d: { recipients: Recipient[]; plan: string; limit: number }) => {
        setRecipients(d.recipients)
        setPlan(d.plan as Plan)
        setLimit(d.limit)
      })
      .catch(() => null)
      .finally(() => setIsLoading(false))
  }, [])

  const atLimit = recipients.length >= limit

  async function handleAdd() {
    if (atLimit) { setShowUpgrade(true); return }
    if (!name.trim() || !email.trim()) return

    setIsAdding(true)
    setAddError(null)

    const res = await fetch('/api/settings/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), brief_variant: variant }),
    })

    if (res.ok) {
      const r = await res.json() as Recipient
      setRecipients(prev => [...prev, r])
      setName('')
      setEmail('')
      setVariant('full')
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string; upgrade?: boolean }
      if (body.upgrade) { setShowUpgrade(true) }
      else setAddError(body.error ?? 'Failed to add recipient')
    }
    setIsAdding(false)
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/settings/recipients/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setRecipients(prev => prev.filter(r => r.recipient_id !== id))
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Recipients</h1>
        <p className="mt-1 text-[13px] text-muted">
          Who receives the weekly brief. Each person gets the version that suits their role.
        </p>
      </div>

      {/* Add recipient */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="label-section">Add recipient</p>
            <span className="text-[11px] text-muted font-mono">
              {isLoading ? '…' : `${recipients.length} / ${limit}`}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              type="email"
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
          >
            <option value="full">Full brief — Founder / CMO</option>
            <option value="channel_focus">Channel focus — Brand / Social manager</option>
            <option value="executive_digest">Executive digest — CEO / Board observer</option>
          </select>
          {addError && <p className="text-[12px] text-threat">{addError}</p>}
          <div className="flex items-center justify-between">
            {atLimit && (
              <p className="text-[11px] text-watch">Recipient limit reached. Upgrade to add more.</p>
            )}
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isAdding || (!atLimit && (!name.trim() || !email.trim()))}
              >
                {isAdding ? 'Adding…' : atLimit ? 'Upgrade to add more' : '+ Add recipient'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients list */}
      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center py-10">
            <p className="text-[13px] text-muted">Loading…</p>
          </div>
        </Card>
      ) : recipients.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-ink">No recipients yet</p>
            <p className="text-[13px] text-muted mt-1">Add who should receive the weekly brief.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-section">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
            {recipients.map((r) => (
              <div
                key={r.recipient_id}
                className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-[13px] font-medium text-ink">{r.name}</p>
                  <p className="text-[11px] text-muted">{r.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-[10px]">
                    {VARIANT_LABELS[r.brief_variant] ?? r.brief_variant}
                  </Badge>
                  <button
                    onClick={() => handleRemove(r.recipient_id)}
                    className="text-[11px] text-muted hover:text-threat transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="recipients"
        currentPlan={plan}
      />
    </div>
  )
}
