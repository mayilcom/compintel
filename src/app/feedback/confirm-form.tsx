'use client'

import { useState, useTransition } from 'react'
import type { FeedbackAction } from '@/lib/feedback-token'

interface Props {
  signalId:  string
  accountId: string
  action:    FeedbackAction
  token:     string
}

const CTA_LABEL: Record<FeedbackAction, string> = {
  useful:     'Send feedback',
  not_useful: 'Send feedback',
  acted_on:   'Confirm',
}

const NOTE_PROMPT: Record<FeedbackAction, string> = {
  useful:     'Optional — what made this land?',
  not_useful: 'Optional — what was off? (wrong competitor, stale, too vague, …)',
  acted_on:   'Optional — what did you do with it?',
}

export function FeedbackConfirmForm({ signalId, accountId, action, token }: Props) {
  const [note, setNote]           = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/feedback/email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ s: signalId, a: accountId, v: action, t: token, note: note.trim() || undefined }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(typeof data.error === 'string' ? data.error : 'Could not record feedback.')
          return
        }
        setSubmitted(true)
      } catch {
        setError('Network error. Try again?')
      }
    })
  }

  if (submitted) {
    return (
      <div className="rounded-[10px] border border-gold/30 bg-gold-bg px-5 py-4 text-center">
        <p className="font-display text-lg text-gold-dark">Thanks — recorded.</p>
        <p className="mt-1 text-[13px] text-muted">Your note will sharpen next Sunday&apos;s brief.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      <label htmlFor="feedback-note" className="label-section mb-2 block">
        {NOTE_PROMPT[action]}
      </label>
      <textarea
        id="feedback-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        rows={4}
        className="w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
        placeholder="Add more context if you want — or just send."
      />

      {error && (
        <p className="mt-2 text-[12px] text-threat">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="mt-4 w-full rounded-[8px] bg-ink text-surface text-[13px] font-medium py-2.5 hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Sending…' : CTA_LABEL[action]}
      </button>
    </div>
  )
}
