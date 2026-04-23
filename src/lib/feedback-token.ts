import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signed-URL feedback tokens for email-brief links.
 *
 * Payload: `${signal_id}.${account_id}.${action}`
 * Signing: HMAC-SHA256 using RESEND_API_KEY as the secret, matching the
 *          existing unsubscribe-link convention.
 *
 * No expiry — feedback links live in email archives indefinitely; a
 * recipient clicking a month-old link should still be able to record
 * their reaction. Replay protection is not needed: `signal_feedback`
 * and `signal_actions` store history (one row per click), so a
 * duplicate click just adds an extra row. The latest row wins.
 */

export type FeedbackAction = 'useful' | 'not_useful' | 'acted_on'

export const ALL_ACTIONS: readonly FeedbackAction[] = ['useful', 'not_useful', 'acted_on']

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

export function verifyFeedback(
  signalId: string,
  accountId: string,
  action: FeedbackAction,
  token: string,
): boolean {
  const expected = signFeedback(signalId, accountId, action)
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
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

export function isFeedbackAction(value: unknown): value is FeedbackAction {
  return typeof value === 'string' && (ALL_ACTIONS as readonly string[]).includes(value)
}
