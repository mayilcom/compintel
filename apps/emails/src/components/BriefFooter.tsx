import * as React from 'react'
import { Section, Row, Column, Text, Link, Hr } from '@react-email/components'
import { colors, fonts } from '../tokens'

interface BriefFooterProps {
  issueNumber: number
  weekRange: string
  webUrl: string
  unsubscribeUrl: string
}

export function BriefFooter({ issueNumber, weekRange, webUrl, unsubscribeUrl }: BriefFooterProps) {
  return (
    <>
      <Hr style={{ borderColor: colors.border, margin: '8px 32px 0' }} />
      <Section style={{ padding: '16px 32px 24px' }}>
        <Row>
          <Column>
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}>
              Brief #{issueNumber} · {weekRange}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ fontFamily: fonts.mono, fontSize: '10px', color: colors.muted, margin: '0' }}>
              <Link href={webUrl} style={{ color: colors.gold, textDecoration: 'none' }}>
                View in browser
              </Link>
              {' · '}
              <Link href={unsubscribeUrl} style={{ color: colors.muted, textDecoration: 'none' }}>
                Unsubscribe
              </Link>
            </Text>
          </Column>
        </Row>
        <Text style={{
          fontFamily: fonts.mono,
          fontSize: '10px',
          color: colors.border,
          margin: '8px 0 0',
        }}>
          Sent by Mayil · emayil.com · briefs@emayil.com
        </Text>
      </Section>
    </>
  )
}
