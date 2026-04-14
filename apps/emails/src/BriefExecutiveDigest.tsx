import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Text, Preview,
} from '@react-email/components'
import { BriefHeader } from './components/BriefHeader'
import { BriefFooter } from './components/BriefFooter'
import { colors, fonts, SIGNAL_COLORS } from './tokens'
import type { SignalData } from './components/SignalCard'

export interface BriefExecutiveDigestProps {
  brandName: string
  issueNumber: number
  weekRange: string
  recipientName: string
  signals: SignalData[]   // top 1–2 only; body truncated to 3 lines
  webUrl: string
  unsubscribeUrl: string
}

/** Truncate to approximately N lines of body text (≈80 chars/line). */
function truncateLines(text: string, lines = 3): string {
  const limit = lines * 80
  if (text.length <= limit) return text
  return text.slice(0, limit).replace(/\s+\S*$/, '') + '…'
}

export function BriefExecutiveDigest({
  brandName,
  issueNumber,
  weekRange,
  recipientName,
  signals,
  webUrl,
  unsubscribeUrl,
}: BriefExecutiveDigestProps) {
  const top = signals.slice(0, 2)

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>
        {top[0] ? top[0].headline : `${brandName} competitive brief — ${weekRange}`}
      </Preview>
      <Body style={{ backgroundColor: colors.paper, margin: '0', padding: '0' }}>
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: colors.surface,
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
        }}>

          <BriefHeader issueNumber={issueNumber} weekRange={weekRange} brandName={brandName} />

          {/* Greeting */}
          <Section style={{ padding: '24px 32px 8px' }}>
            <Text style={{
              fontFamily: fonts.body,
              fontSize: '14px',
              color: colors.muted,
              margin: '0',
              lineHeight: '1.6',
            }}>
              Hi {recipientName} — {top.length === 1 ? '1 signal' : `${top.length} signals`} worth your attention this week.
            </Text>
          </Section>

          {/* Compact signal rows — no implication box, 3-line body max */}
          {top.map((signal, i) => {
            const sig = SIGNAL_COLORS[signal.signal_type] ?? SIGNAL_COLORS.watch
            return (
              <Section key={i} style={{
                margin: '12px 32px',
                padding: '16px 20px',
                backgroundColor: colors.surface,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${sig.text}`,
              }}>
                {/* Badge + channel */}
                <Text style={{
                  fontFamily: fonts.mono,
                  fontSize: '10px',
                  color: sig.text,
                  margin: '0 0 6px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                }}>
                  {sig.label} · {signal.channel.replace('_', ' ')} · {signal.competitor_name}
                </Text>
                {/* Headline */}
                <Text style={{
                  fontFamily: fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.ink,
                  margin: '0 0 6px',
                  lineHeight: '1.4',
                }}>
                  {signal.headline}
                </Text>
                {/* Body — 3 lines max */}
                <Text style={{
                  fontFamily: fonts.body,
                  fontSize: '13px',
                  color: colors.muted,
                  margin: '0 0 8px',
                  lineHeight: '1.55',
                }}>
                  {truncateLines(signal.body, 3)}
                </Text>
                {/* Implication — 1 line, gold */}
                <Text style={{
                  fontFamily: fonts.body,
                  fontSize: '13px',
                  color: colors.goldDark,
                  margin: '0',
                  lineHeight: '1.4',
                }}>
                  → {signal.implication}
                </Text>
              </Section>
            )
          })}

          {/* Full brief nudge */}
          <Section style={{ padding: '4px 32px 20px' }}>
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0',
              textAlign: 'center' as const,
            }}>
              <a href={webUrl} style={{ color: colors.gold, textDecoration: 'none' }}>
                View full brief →
              </a>
            </Text>
          </Section>

          <BriefFooter
            issueNumber={issueNumber}
            weekRange={weekRange}
            webUrl={webUrl}
            unsubscribeUrl={unsubscribeUrl}
          />
        </Container>
      </Body>
    </Html>
  )
}

export default BriefExecutiveDigest
