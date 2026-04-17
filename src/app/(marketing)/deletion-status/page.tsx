export const metadata = {
  title: 'Data Deletion Status — Mayil',
}

export default function DeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="label-section mb-3">Data deletion</p>
      <h1 className="font-display text-2xl text-ink mb-4">Your data has been deleted</h1>
      <p className="text-[14px] text-muted leading-relaxed mb-8">
        All Instagram data associated with your account has been removed from Mayil&apos;s
        systems. This includes your access token and any cached insights data.
      </p>
      <ConfirmationCode searchParams={searchParams} />
      <p className="text-[13px] text-muted mt-8">
        Questions? Email us at{' '}
        <a href="mailto:hello@emayil.com" className="text-gold-dark hover:underline">
          hello@emayil.com
        </a>
      </p>
    </div>
  )
}

async function ConfirmationCode({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  if (!code) return null
  return (
    <div className="rounded-[10px] border border-border bg-surface-2 px-6 py-4 inline-block">
      <p className="text-[11px] text-muted label-section mb-1">Confirmation code</p>
      <p className="font-mono text-sm text-ink">{code}</p>
    </div>
  )
}
