'use client'

import { useState, useTransition } from 'react'

type FeedbackState = 'none' | 'useful' | 'not_useful'

interface Props {
  signalId:        string
  initialFeedback: FeedbackState
  initialActedOn:  boolean
}

/**
 * Subtle per-signal controls on the app brief page.
 *  - thumbs up / thumbs down icons (no labels, no toast)
 *  - "Acted on this" pill toggle
 *
 * Visual follows ADR-013: muted by default, gold-dark when active.
 * No counts surfaced to user. No confirmation toast.
 */
export function SignalFeedbackControls({
  signalId,
  initialFeedback,
  initialActedOn,
}: Props) {
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback)
  const [actedOn,  setActedOn]  = useState<boolean>(initialActedOn)
  const [, startTransition] = useTransition()

  const postFeedback = (useful: boolean) => {
    const next: FeedbackState = useful ? 'useful' : 'not_useful'
    const prev = feedback
    setFeedback(next === prev ? 'none' : next)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/signals/${signalId}/feedback`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ useful }),
        })
        if (!res.ok) setFeedback(prev)
      } catch {
        setFeedback(prev)
      }
    })
  }

  const toggleActedOn = () => {
    const next = !actedOn
    setActedOn(next)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/signals/${signalId}/action`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ acted_on: next }),
        })
        if (!res.ok) setActedOn(!next)
      } catch {
        setActedOn(!next)
      }
    })
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={toggleActedOn}
        aria-pressed={actedOn}
        className={
          actedOn
            ? 'rounded-full bg-gold-bg border border-gold/40 px-2.5 py-0.5 text-[11px] font-mono text-gold-dark transition-colors'
            : 'rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-mono text-muted hover:text-ink transition-colors'
        }
      >
        {actedOn ? '✓ Acted on this' : 'Acted on this'}
      </button>

      <div className="flex items-center gap-2 text-muted">
        <button
          type="button"
          onClick={() => postFeedback(true)}
          aria-pressed={feedback === 'useful'}
          aria-label="Useful"
          className={
            feedback === 'useful'
              ? 'text-ink transition-colors'
              : 'text-muted hover:text-ink transition-colors'
          }
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 7v7H2V7h3zM5 7l3.5-5a1.5 1.5 0 0 1 2.8 1.1l-.6 3.4h3.5a1 1 0 0 1 1 1.2l-1 5a1 1 0 0 1-1 .8H5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => postFeedback(false)}
          aria-pressed={feedback === 'not_useful'}
          aria-label="Not useful"
          className={
            feedback === 'not_useful'
              ? 'text-ink transition-colors'
              : 'text-muted hover:text-ink transition-colors'
          }
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 9V2h3v7h-3zM11 9l-3.5 5a1.5 1.5 0 0 1-2.8-1.1l.6-3.4H1.8a1 1 0 0 1-1-1.2l1-5a1 1 0 0 1 1-.8H11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
