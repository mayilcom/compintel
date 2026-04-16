'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from '@/components/onboarding/progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BRIEF_BRIEF_VARIANT_LABELS } from '@/lib/constants'

interface Recipient {
  recipient_id: string
  name: string
  email: string
  brief_variant: string
  active: boolean
}

const VARIANTS = [
  { id: 'full',             label: 'Full brief',        description: 'All signals, data grid, press items, closing question.', forWho: 'Founder / CMO' },
  { id: 'channel_focus',    label: 'Channel focus',     description: 'Full brief + channel-specific appendix.',               forWho: 'Brand / Social manager' },
  { id: 'executive_digest', label: 'Executive digest',  description: '3 sentences. One metric. One question. 45 seconds.',   forWho: 'CEO / Board observer' },
]

export default function OnboardingRecipientsPage() {
  const router = useRouter()

  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [variant, setVariant] = useState('full')
  const [added, setAdded]     = useState<Recipient[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim() || !email.trim()) return
    setIsAdding(true)
    setError(null)

    const res = await fetch('/api/settings/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), brief_variant: variant }),
    })

    if (res.ok) {
      const r = await res.json() as Recipient
      setAdded(prev => [...prev, r])
      setName('')
      setEmail('')
      setVariant('full')
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Failed to add recipient')
    }
    setIsAdding(false)
  }

  async function handleContinue() {
    setIsSaving(true)
    router.push('/onboarding/done')
  }

  return (
    <div>
      <OnboardingProgress currentStep={4} />

      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink">Who receives the brief?</h1>
        <p className="mt-2 text-[13px] text-muted">
          Add email addresses that should receive the weekly brief. Each recipient
          gets the version that fits their role. You&apos;re added automatically.
        </p>
      </div>

      {/* Brief variants */}
      <div className="mb-6">
        <p className="label-section mb-3">Brief variants</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {VARIANTS.map((v) => (
            <div key={v.id} className="rounded-[10px] border border-border bg-surface-2 p-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink">{v.label}</span>
              <span className="text-[11px] text-muted">{v.description}</span>
              <span className="text-[11px] text-gold-dark font-medium mt-1">{v.forWho}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add recipient */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <p className="label-section mb-3">Add recipient</p>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted">Name</label>
                <input
                  type="text"
                  placeholder="Rahul Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted">Email</label>
                <input
                  type="email"
                  placeholder="rahul@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">Brief variant</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="full">Full brief — Founder / CMO</option>
                <option value="channel_focus">Channel focus — Brand / Social manager</option>
                <option value="executive_digest">Executive digest — CEO / Board observer</option>
              </select>
            </div>
            {error && <p className="text-[12px] text-threat">{error}</p>}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdd}
                disabled={isAdding || !name.trim() || !email.trim()}
              >
                {isAdding ? 'Adding…' : '+ Add recipient'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Added list */}
      {added.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border">
              <p className="label-section">{added.length} recipient{added.length !== 1 ? 's' : ''} added</p>
            </div>
            {added.map((r) => (
              <div key={r.recipient_id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-ink">{r.name}</p>
                  <p className="text-[11px] text-muted">{r.email}</p>
                </div>
                <Badge variant="default" className="text-[10px]">
                  {BRIEF_VARIANT_LABELS[r.brief_variant] ?? r.brief_variant}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[13px] text-muted">
        You can add and remove recipients any time from Settings → Recipients.
      </p>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="ghost" asChild>
          <a href="/onboarding/channels">← Back</a>
        </Button>
        <div className="flex items-center gap-3">
          {added.length === 0 && (
            <Button variant="ghost" onClick={handleContinue} disabled={isSaving} className="text-muted hover:text-ink">
              Skip for now
            </Button>
          )}
          <Button onClick={handleContinue} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Finish setup →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
