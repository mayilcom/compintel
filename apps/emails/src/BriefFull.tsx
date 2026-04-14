import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Text, Preview,
} from '@react-email/components'
import { BriefHeader } from './components/BriefHeader'
import { SignalCard, type SignalData } from './components/SignalCard'
import { BriefFooter } from './components/BriefFooter'
import { colors, fonts } from './tokens'

export interface BriefFullProps {
  brandName: string
  issueNumber: number
  weekRange: string
  headline: string
  summary: string           // 2–3 sentence intro paragraph
  signals: SignalData[]     // up to 5, ordered by score desc
  closingQuestion: string   // the strategic provocation
  webUrl: string
  unsubscribeUrl: string
}

export function BriefFull({
  brandName,
  issueNumber,
  weekRange,
  headline,
  summary,
  signals,
  closingQuestion,
  webUrl,
  unsubscribeUrl,
}: BriefFullProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{headline}</Preview>
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

          {/* This week's story */}
          <Section style={{ padding: '28px 32px 16px' }}>
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0 0 10px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              This week's story
            </Text>
            <Text style={{
              fontFamily: fonts.display,
              fontSize: '22px',
              color: colors.ink,
              margin: '0 0 12px',
              lineHeight: '1.3',
              letterSpacing: '-0.3px',
            }}>
              {headline}
            </Text>
            <Text style={{
              fontFamily: fonts.body,
              fontSize: '14px',
              color: colors.muted,
              margin: '0',
              lineHeight: '1.65',
            }}>
              {summary}
            </Text>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '4px 32px 20px' }}>
            <div style={{ height: '1px', backgroundColor: colors.border }} />
          </Section>

          {/* Signals */}
          {signals.map((signal, i) => (
            <SignalCard key={i} signal={signal} />
          ))}

          {/* Closing question */}
          <Section style={{ padding: '8px 32px 28px' }}>
            <div style={{ height: '1px', backgroundColor: colors.border, marginBottom: '20px' }} />
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0 0 10px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              This week's question
            </Text>
            <Text style={{
              fontFamily: fonts.display,
              fontSize: '16px',
              color: colors.ink,
              margin: '0',
              lineHeight: '1.5',
              fontStyle: 'italic',
            }}>
              {closingQuestion}
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

export default BriefFull
