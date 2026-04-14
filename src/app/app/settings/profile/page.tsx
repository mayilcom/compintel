'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfileData {
  first_name:      string
  last_name:       string
  email:           string
  company_name:    string | null
  role:            string | null
  whatsapp_number: string | null
}

export default function ProfileSettingsPage() {
  const [data, setData]         = useState<ProfileData | null>(null)
  const [company, setCompany]   = useState('')
  const [role, setRole]         = useState('')
  const [phone, setPhone]       = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then((d: ProfileData) => {
        setData(d)
        setCompany(d.company_name ?? '')
        setRole(d.role ?? '')
        setPhone(d.whatsapp_number ?? '')
      })
      .catch(() => null)
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setSaved(false)
    setError(null)

    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name:    company.trim() || null,
        role:            role.trim()    || null,
        whatsapp_number: phone.trim()   || null,
      }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? 'Failed to save')
    }
    setIsSaving(false)
  }

  const displayName = data
    ? [data.first_name, data.last_name].filter(Boolean).join(' ') || '—'
    : '—'

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-xl text-ink">Profile</h1>
        <p className="mt-1 text-[13px] text-muted">
          Your personal details and workspace information.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-5">
          {/* Name — read-only from Clerk */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="label-section">Full name</label>
              <input
                type="text"
                disabled
                value={displayName}
                className="h-9 rounded-[8px] border border-border bg-surface-2 px-3 text-sm text-muted cursor-not-allowed"
              />
              <p className="text-[11px] text-muted">Managed by your Google account.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-section">Role</label>
              <input
                type="text"
                placeholder="Founder / CMO"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Company</label>
            <input
              type="text"
              placeholder="Sunfeast Foods"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Email</label>
            <input
              type="email"
              disabled
              value={data?.email ?? ''}
              className="h-9 rounded-[8px] border border-border bg-surface-2 px-3 text-sm text-muted cursor-not-allowed"
            />
            <p className="text-[11px] text-muted">Managed by your Google account via Clerk.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-section">Phone (for WhatsApp alerts — coming soon)</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {error && <p className="text-[12px] text-threat">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && <span className="text-[12px] text-opportunity">Saved</span>}
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
