import * as React from 'react'
import { Section, Row, Column, Text, Hr } from '@react-email/components'
import { colors, fonts } from '../tokens'

interface BriefHeaderProps {
  issueNumber: number
  weekRange: string   // e.g. "Apr 7–13, 2026"
  brandName: string
}

export function BriefHeader({ issueNumber, weekRange, brandName }: BriefHeaderProps) {
  return (
    <>
      <Section style={{ backgroundColor: colors.surface, padding: '20px 32px 0' }}>
        <Row>
          <Column>
            <Text style={{
              fontFamily: fonts.display,
              fontSize: '20px',
              color: colors.ink,
              margin: '0',
              letterSpacing: '-0.3px',
            }}>
              Mayil
            </Text>
          </Column>
          <Column align="right">
            <Text style={{
              fontFamily: fonts.mono,
              fontSize: '10px',
              color: colors.muted,
              margin: '0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {brandName} · Brief #{issueNumber} · {weekRange}
            </Text>
          </Column>
        </Row>
      </Section>
      <Hr style={{ borderColor: colors.border, margin: '0 32px' }} />
    </>
  )
}
