import { createHmac, timingSafeEqual } from 'crypto'

/** Mirrors the logic in src/app/api/unsubscribe/route.ts. Keep in sync. */
export function unsubscribeUrl(recipientId: string, baseUrl: string): string {
  const secret = process.env.RESEND_API_KEY ?? 'fallback-secret'
  const token  = createHmac('sha256', secret).update(recipientId).digest('hex')
  return `${baseUrl}/api/unsubscribe?id=${recipientId}&token=${token}`
}
