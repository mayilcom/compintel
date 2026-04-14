import { UpgradePlanCards } from '@/components/upgrade/plan-cards'

export const metadata = { title: 'Upgrade — Mayil' }

const REASON_MESSAGES: Record<string, string> = {
  competitors: "You've reached your competitor limit.",
  recipients:  "You've reached your recipient limit.",
  channels:    "You've reached your channel limit.",
  brands:      "You've reached your brand limit.",
  seats:       "You've reached your team seat limit.",
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const message = reason ? (REASON_MESSAGES[reason] ?? null) : null

  return <UpgradePlanCards message={message} />
}
