export const metadata = { title: 'Unsubscribed — Mayil' }

export default function UnsubscribedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-sm text-center flex flex-col gap-4">
        <span className="font-display text-2xl text-ink">You've been unsubscribed</span>
        <p className="text-[13px] text-muted leading-relaxed">
          You won't receive any more Mayil briefs at this address.
          If this was a mistake, ask your account owner to re-add you in Settings → Recipients.
        </p>
        <a
          href="/"
          className="text-[13px] text-gold hover:text-gold-dark transition-colors font-medium"
        >
          Back to Mayil
        </a>
      </div>
    </div>
  )
}
