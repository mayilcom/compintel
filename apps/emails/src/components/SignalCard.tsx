import * as React from 'react'
import { Section, Text, Link } from '@react-email/components'
import { colors, fonts, SIGNAL_COLORS } from '../tokens'

export interface SignalData {
  signal_type: 'threat' | 'watch' | 'opportunity' | 'trend' | 'silence'
  channel: string
  competitor_name: string
  headline: string
  body: string
  implication: string
  source_url?: string
}

interface SignalCardProps {
  signal: SignalData
}

const CHANNEL_LABELS: Record<string, string> = {
  instagram:   'Instagram',
  meta_ads:    'Meta Ads',
  amazon:      'Amazon',
  news:        'News / PR',
  google_ads:  'Google Ads',
  linkedin:    'LinkedIn',
  youtube:     'YouTube',
  twitter:     'X (Twitter)',
}

export function SignalCard({ signal }: SignalCardProps) {
  const sig = SIGNAL_COLORS[signal.signal_type] ?? SIGNAL_COLORS.watch
  const channelLabel = CHANNEL_LABELS[signal.channel] ?? signal.channel

  return (
    <Section style={{
      backgroundColor: colors.surface,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      margin: '0 32px 16px',
      overflow: 'hidden',
    }}>
      {/* Signal type badge + channel · competitor */}
      <Section style={{ padding: '14px 20px 0' }}>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle' }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: sig.bg,
                  color: sig.text,
                  fontFamily: fonts.mono,
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: '999px',
                }}>
                  {sig.label}
                </span>
              </td>
              <td align="right" style={{ verticalAlign: 'middle' }}>
                <Text style={{
                  fontFamily: fonts.mono,
                  fontSize: '10px',
                  color: colors.muted,
                  margin: '0',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}>
                  {channelLabel} · {signal.competitor_name}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Headline */}
      <Section style={{ padding: '10px 20px 0' }}>
        <Text style={{
          fontFamily: fonts.body,
          fontSize: '15px',
          fontWeight: 600,
          color: colors.ink,
          margin: '0',
          lineHeight: '1.4',
        }}>
          {signal.headline}
        </Text>
      </Section>

      {/* Body */}
      <Section style={{ padding: '8px 20px 0' }}>
        <Text style={{
          fontFamily: fonts.body,
          fontSize: '13px',
          color: colors.muted,
          margin: '0',
          lineHeight: '1.6',
        }}>
          {signal.body}
        </Text>
      </Section>

      {/* Implication box */}
      <Section style={{ padding: '10px 20px' }}>
        <Section style={{
          backgroundColor: colors.goldBg,
          borderLeft: `3px solid ${colors.gold}`,
          borderRadius: '0 6px 6px 0',
          padding: '10px 14px',
        }}>
          <Text style={{
            fontFamily: fonts.mono,
            fontSize: '9px',
            color: colors.goldDark,
            margin: '0 0 4px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}>
            What this means for you
          </Text>
          <Text style={{
            fontFamily: fonts.body,
            fontSize: '13px',
            color: colors.ink,
            margin: '0',
            lineHeight: '1.5',
          }}>
            {signal.implication}
          </Text>
        </Section>
      </Section>

      {/* Source link */}
      {signal.source_url && (
        <Section style={{ padding: '0 20px 14px' }}>
          <Link
            href={signal.source_url}
            style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.gold,
              textDecoration: 'none',
            }}
          >
            View source →
          </Link>
        </Section>
      )}
    </Section>
  )
}
