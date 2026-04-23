import { createHmac } from 'crypto'

/**
 * Mirror of src/lib/feedback-token.ts for the workers package.
 * Keep in sign() / payload() / action set in sync with the web copy —
 * they share a secret and a URL format.
 *
 * Workers only need to SIGN (to build feedback URLs in outgoing email).
 * The web app does the VERIFY when the recipient clicks.
 */

export type FeedbackAction = 'useful' | 'not_useful' | 'acted_on'

function secret(): string {
  return process.env.RESEND_API_KEY ?? 'fallback-secret'
}

function payload(signalId: string, accountId: string, action: FeedbackAction): string {
  return `${signalId}.${accountId}.${action}`
}

export function signFeedback(
  signalId: string,
  accountId: string,
  action: FeedbackAction,
): string {
  return createHmac('sha256', secret()).update(payload(signalId, accountId, action)).digest('hex')
}

export function feedbackUrl(
  signalId: string,
  accountId: string,
  action: FeedbackAction,
  baseUrl: string,
): string {
  const token = signFeedback(signalId, accountId, action)
  const params = new URLSearchParams({
    s: signalId,
    a: accountId,
    v: action,
    t: token,
  })
  return `${baseUrl}/feedback?${params.toString()}`
}
