'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface CompetitorSuggestion {
  suggestion_id:      string
  website:            string
  brand_name:         string | null
  competition_reason: string | null
}

interface Props {
  suggestions: CompetitorSuggestion[]
}

function displayName(s: CompetitorSuggestion): string {
  if (s.brand_name) return s.brand_name
  return s.website
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function reasonLabel(reason: string | null): string {
  if (reason === 'product_overlap')         return 'Product overlap'
  if (reason === 'organic_keyword_overlap') return 'Keyword overlap'
  return 'Competitor'
}

export function CompetitorSuggestions({ suggestions }: Props) {
  const [items, setItems]   = useState(suggestions)
  const [loading, setLoading] = useState<string | null>(null)

  if (items.length === 0) return null

  async function act(id: string, action: 'accept' | 'dismiss') {
    setLoading(id)
    await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setItems(prev => prev.filter(s => s.suggestion_id !== id))
    setLoading(null)
  }

  async function acceptAll() {
    for (const s of items) await act(s.suggestion_id, 'accept')
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="label-section mb-0.5">Suggested competitors</p>
          <p className="text-[13px] text-muted">
            Found via NinjaPear — not yet in your tracking list
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={acceptAll}>
          Add all
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {items.map(s => (
          <div key={s.suggestion_id} className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{displayName(s)}</p>
              <p className="text-[11px] text-muted mt-0.5">{reasonLabel(s.competition_reason)}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={loading === s.suggestion_id}
                onClick={() => act(s.suggestion_id, 'accept')}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={loading === s.suggestion_id}
                onClick={() => act(s.suggestion_id, 'dismiss')}
                className="text-muted hover:text-ink"
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
