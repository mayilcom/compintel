/**
 * delivery.ts â€” Stage 6 of 6
 *
 * Schedule: Sunday 7am IST (cron: 30 1 * * 0 UTC)
 *
 * Sends the assembled brief to all active recipients for each account.
 * Only processes briefs with status = 'assembled' (held briefs are skipped).
 * After sending, flips brief.status â†’ 'sent' and sets sent_at.
 * If the account is on trial and this is their first brief, sets
 * accounts.trial_brief_sent = true.
 */

import { Resend } from 'resend'
import { db } from '../lib/supabase'
import { makeLogger, serializeError } from '../lib/logger'

const log    = makeLogger('delivery')
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = 'Mayil <briefs@emayil.com>'

function currentWeekStart(): string {
  if (process.env.WEEK_OVERRIDE) return process.env.WEEK_OVERRIDE
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

async function run() {
  const weekStart = currentWeekStart()
  log.info('starting', { weekStart })

  // Only pick up briefs that are assembled (not held, not already sent)
  const { data: briefs, error: briefErr } = await db
    .from('briefs')
    .select('*')
    .eq('week_start', weekStart)
    .eq('status', 'assembled')

  if (briefErr) throw briefErr
  log.info('briefs to deliver', { count: briefs.length })

  let sent    = 0
  let skipped = 0
  let failed  = 0

  // â”€â”€ Bulk-fetch accounts and recipients before the loop â”€â”€â”€â”€â”€â”€â”€â”€
  // Avoids N+1: 2 queries for all accounts instead of 2Ã—N queries
  const accountIds = (briefs as Array<Record<string, unknown>>).map(b => b.account_id as string)

  const { data: accountRows } = await db
    .from('accounts')
    .select('account_id, plan, subscription_status, is_locked, delivery_paused, skip_next_delivery, trial_brief_sent')
    .in('account_id', accountIds)

  const { data: recipientRows } = await db
    .from('recipients')
    .select('*')
    .in('account_id', accountIds)
    .eq('active', true)

  type AccountRow   = Record<string, unknown>
  type RecipientRow = Record<string, unknown>

  const accountMap   = new Map<string, AccountRow>(
    (accountRows ?? []).map((a: AccountRow) => [a.account_id as string, a])
  )
  const recipientMap = new Map<string, RecipientRow[]>()
  for (const r of (recipientRows ?? []) as RecipientRow[]) {
    const aid = r.account_id as string
    if (!recipientMap.has(aid)) recipientMap.set(aid, [])
    recipientMap.get(aid)!.push(r)
  }

  for (const brief of briefs as Array<Record<string, unknown>>) {
    const briefId   = brief.brief_id as string
    const accountId = brief.account_id as string

    // Check account still active (race-condition safety)
    const account = accountMap.get(accountId)

    if (!account) { skipped++; continue }

    const acc = account as Record<string, unknown>
    if (acc.is_locked || acc.delivery_paused) { skipped++; continue }
    if (!['trialing', 'active'].includes(acc.subscription_status as string)) { skipped++; continue }

    // One-time skip
    if (acc.skip_next_delivery) {
      log.info('skipping delivery (skip_next_delivery)', { account_id: accountId })
      await db.from('accounts').update({ skip_next_delivery: false }).eq('account_id', accountId)
      skipped++
      continue
    }

    // Trial accounts: only send if trial_brief_sent is false
    if (acc.plan === 'trial' && acc.trial_brief_sent) {
      log.info('trial brief already sent â€” skipping', { account_id: accountId })
      skipped++
      continue
    }

    // Load active recipients from pre-fetched map
    const recipients = recipientMap.get(accountId)

    if (!recipients?.length) {
      log.warn('no recipients', { account_id: accountId })
      skipped++
      continue
    }

    // Per-recipient variant HTML stored by assembler
    const variantHtml = (brief.variant_html ?? {}) as Record<string, string>
    const fallbackHtml = brief.html_content as string

    let accountSendFailed = false

    for (const recipient of recipients as Array<Record<string, unknown>>) {
      const recipientId = recipient.recipient_id as string
      const html = variantHtml[recipientId] ?? fallbackHtml

      if (!html) {
        log.warn('no html for recipient', { recipient_id: recipientId })
        continue
      }

      try {
        const { error: sendErr } = await resend.emails.send({
          from:    FROM_ADDRESS,
          to:      [recipient.email as string],
          subject: brief.subject_line as string,
          html,
          headers: {
            // One-click unsubscribe (RFC 8058 / Gmail/Yahoo requirement)
            'List-Unsubscribe':      `<${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?id=${recipientId}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          tags: [
            { name: 'brief_id',    value: briefId },
            { name: 'account_id',  value: accountId },
            { name: 'variant',     value: recipient.brief_variant as string },
          ],
        })

        if (sendErr) {
          log.error('resend error', { recipient_id: recipientId, error: String(sendErr) })
          accountSendFailed = true
        } else {
          sent++
        }
      } catch (err) {
        log.error('send exception', { recipient_id: recipientId, error: serializeError(err) })
        accountSendFailed = true
      }
    }

    if (accountSendFailed) {
      failed++
      await db.from('briefs').update({ status: 'failed' }).eq('brief_id', briefId)
      continue
    }

    // Mark brief as sent
    await db.from('briefs').update({
      status:  'sent',
      sent_at: new Date().toISOString(),
    }).eq('brief_id', briefId)

    // Trial: mark first brief as sent
    if (acc.plan === 'trial' && !acc.trial_brief_sent) {
      await db.from('accounts').update({ trial_brief_sent: true }).eq('account_id', accountId)
      log.info('trial brief sent', { account_id: accountId })
    }
  }

  log.info('done', { sent, skipped, failed })

  if (failed > 0) {
    log.warn(`${failed} brief(s) failed delivery â€” check Resend dashboard and brief status`)
  }
}

run().catch(err => {
  log.error('fatal', { error: serializeError(err) })
  process.exit(1)
})

