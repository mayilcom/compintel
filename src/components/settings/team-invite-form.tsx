'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  seatLimit:    number | null
  currentCount: number
}

export function TeamInviteForm({ seatLimit, currentCount }: Props) {
  const [email, setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const atLimit = seatLimit !== null && currentCount >= seatLimit

  async function handleInvite() {
    if (!email.trim() || atLimit) return
    setSending(true)
    setSent(false)
    setError(null)

    const res = await fetch('/api/settings/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })

    if (res.ok) {
      setSent(true)
      setEmail('')
      setTimeout(() => setSent(false), 4000)
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Failed to send invite')
    }
    setSending(false)
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-3">
        <p className="label-section">Invite a teammate</p>
        {atLimit ? (
          <div className="rounded-[8px] border border-border bg-surface-2 px-4 py-3">
            <p className="text-[13px] text-ink font-medium">Seat limit reached</p>
            <p className="text-[13px] text-muted mt-0.5">
              Upgrade your plan to add more team members.
            </p>
            <a href="/upgrade?reason=seats">
              <Button variant="outline" size="sm" className="mt-3">Upgrade plan</Button>
            </a>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="h-9 flex-1 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <Button size="sm" onClick={handleInvite} disabled={sending || !email.trim()}>
                {sending ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
            {sent && (
              <p className="text-[12px] text-opportunity">Invite sent successfully.</p>
            )}
            {error && (
              <p className="text-[12px] text-threat">{error}</p>
            )}
            <p className="text-[11px] text-muted">
              They&apos;ll receive an email to join your workspace. All seats share full workspace access.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
