import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Text, Preview,
} from '@react-email/components'
import { BriefHeader } from './components/BriefHeader'
import { SignalCard, type SignalData } from './components/SignalCard'
import { BriefFooter } from './components/BriefFooter'
import { colors, fonts } from './tokens'

export interface BriefChannelFocusProps {
  brandName: string
  issueNumber: number
  weekRange: string
  recipientName: string
  focusChannels: string[]      // e.g. ['instagram', 'meta_ads']
  signals: SignalData[]        // top 3, grouped/filtered by channel
  webUrl: string
  unsubscribeUrl: string
}

const CHANNEL_LABELS: Record<string, string> = {
  instagram:  'Instagram',
  meta_ads:   'Meta Ads',
  amazon:     'Amazon',
  news:       'News / PR',
  google_ads: 'Google Ads',
  linkedin:   'LinkedIn',
  youtube:    'YouTube',
  twitter:    'X (Twitter)',
}

export function BriefChannelFocus({
  brandName,
  issueNumber,
  weekRange,
  recipientName,
  focusChannels,
  signals,
  webUrl,
  unsubscribeUrl,
}: BriefChannelFocusProps) {
  const channelLabel = focusChannels.map(c => CHANNEL_LABELS[c] ?? c).join(' + ')

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{brandName} · {channelLabel} signals this week</Preview>
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

          {/* Channel focus intro */}
          <Section style={{ padding: '28px 32px 20px' }}>
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0 0 6px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              Channel focus · {channelLabel}
            </Text>
            <Text style={{
              fontFamily: fonts.body,
              fontSize: '14px',
              color: colors.muted,
              margin: '0',
              lineHeight: '1.6',
            }}>
              Hi {recipientName} — here are this week's top signals across {channelLabel} for your tracked competitors.
            </Text>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '0 32px 16px' }}>
            <div style={{ height: '1px', backgroundColor: colors.border }} />
          </Section>

          {/* Top 3 signals */}
          {signals.slice(0, 3).map((signal, i) => (
            <SignalCard key={i} signal={signal} />
          ))}

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

export default BriefChannelFocus
