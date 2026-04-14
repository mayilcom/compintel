import { Badge } from '@/components/ui/badge'

const SIGNAL_STYLES: Record<string, { bg: string; border: string; labelColor: string }> = {
  threat:      { bg: '#FDECEA', border: '#C0392B33', labelColor: '#C0392B' },
  opportunity: { bg: '#EBF7EE', border: '#2D7A4F33', labelColor: '#2D7A4F' },
  watch:       { bg: '#FBF5E4', border: '#B8922A33', labelColor: '#7A5E1A' },
  trend:       { bg: '#EAF1FB', border: '#1A5FA833', labelColor: '#1A5FA8' },
  silence:     { bg: '#F5F4F2', border: '#88878033', labelColor: '#888780' },
}

export interface SignalCardData {
  signal_id:      string
  signal_type:    string
  channel:        string
  competitor_name: string
  headline:       string
  body:           string
  implication:    string | null
  sources:        string[]
}

export function SignalCard({ signal }: { signal: SignalCardData }) {
  const type   = SIGNAL_STYLES[signal.signal_type] ? signal.signal_type : 'watch'
  const styles = SIGNAL_STYLES[type]

  return (
    <div
      style={{ backgroundColor: styles.bg, borderLeft: `3px solid ${styles.labelColor}` }}
      className="rounded-r-[10px] p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={type as 'threat' | 'opportunity' | 'watch' | 'trend'}>
          {type}
        </Badge>
        <span className="text-[11px] text-muted capitalize">
          {signal.channel.replace('_', ' ')} · {signal.competitor_name}
        </span>
      </div>

      <p className="text-sm font-semibold text-ink">{signal.headline}</p>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{signal.body}</p>

      {signal.implication && (
        <div
          style={{ backgroundColor: styles.bg, borderColor: styles.border }}
          className="mt-3 rounded-[8px] border px-3 py-2"
        >
          <p className="text-[12px] font-medium" style={{ color: styles.labelColor }}>
            What this means for you
          </p>
          <p className="text-[12px] text-muted mt-0.5">{signal.implication}</p>
        </div>
      )}

      {signal.sources[0] && (
        <a
          href={signal.sources[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] text-muted hover:text-ink transition-colors"
        >
          Source →
        </a>
      )}
    </div>
  )
}
