'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const ROLES = [
  'Founder / CEO',
  'CMO / VP Marketing',
  'Brand Manager',
  'Growth Manager',
  'Agency / Consultant',
  'Other',
]

const WHAT_YOU_GET = [
  'Live walkthrough of a real competitive brief',
  'Setup for your brand and up to 3 competitors',
  'Q&A on channels, AI interpretation, and delivery',
  'Pricing tailored to your team size',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setErrorMsg(body.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-lg px-6 py-32 text-center">
        <div className="w-10 h-10 rounded-full bg-[#EBF7EE] flex items-center justify-center mx-auto mb-6">
          <span className="text-opportunity text-lg">✓</span>
        </div>
        <h1 className="font-display text-2xl text-ink mb-3">We&apos;ll be in touch</h1>
        <p className="text-[14px] text-muted leading-relaxed">
          Thanks for reaching out. Someone from the Mayil team will contact you within
          one business day to schedule your demo.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-16 lg:grid-cols-2">

        {/* ── Left: value prop ── */}
        <div className="flex flex-col gap-8">
          <div>
            <p className="label-section mb-3">Request a demo</p>
            <h1 className="font-display text-3xl text-ink leading-snug">
              See Mayil working on your market
            </h1>
            <p className="mt-4 text-[14px] text-muted leading-relaxed">
              In 30 minutes we&apos;ll show you a live brief built around your brand and
              competitors — so you can see exactly what lands in your inbox every Sunday.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-ink uppercase tracking-widest">
              What to expect
            </p>
            {WHAT_YOU_GET.map(item => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-gold mt-0.5 shrink-0 text-sm">✓</span>
                <p className="text-[13px] text-muted leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[10px] border border-border bg-surface-2 p-5">
            <p className="text-[13px] text-muted leading-relaxed italic">
              &ldquo;We used to spend Friday afternoons manually checking what Britannia and
              ITC were doing on Instagram. Now it&apos;s in our inbox before we wake up.&rdquo;
            </p>
            <p className="mt-3 text-[12px] text-ink font-medium">
              CMO, FMCG brand · 3 competitors tracked
            </p>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="rounded-[14px] border border-border bg-surface shadow-card p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">Full name <span className="text-threat">*</span></label>
              <input
                type="text"
                placeholder="Rahul Mehta"
                value={form.name}
                onChange={set('name')}
                required
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">Work email <span className="text-threat">*</span></label>
              <input
                type="email"
                placeholder="rahul@brand.com"
                value={form.email}
                onChange={set('email')}
                required
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">Company <span className="text-threat">*</span></label>
              <input
                type="text"
                placeholder="Brand name or agency"
                value={form.company}
                onChange={set('company')}
                required
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">Your role</label>
              <select
                value={form.role}
                onChange={set('role')}
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">Select your role</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted">What would you like to discuss? <span className="text-muted">(optional)</span></label>
              <textarea
                placeholder="e.g. tracking 5 competitors across FMCG, agency use for multiple clients…"
                value={form.message}
                onChange={set('message')}
                rows={3}
                className="rounded-[8px] border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-[12px] text-threat">{errorMsg}</p>
            )}

            <Button type="submit" disabled={status === 'loading'} className="w-full">
              {status === 'loading' ? 'Sending…' : 'Request a demo →'}
            </Button>

            <p className="text-[11px] text-muted text-center">
              No spam. We&apos;ll reply within one business day.
            </p>

          </form>
        </div>

      </div>
    </div>
  )
}
