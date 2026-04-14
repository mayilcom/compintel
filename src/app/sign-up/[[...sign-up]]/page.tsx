import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl text-ink">Mayil</span>
          <p className="mt-2 text-[13px] text-muted">
            Start your 14-day free trial
          </p>
          <p className="mt-1 text-xs text-muted">
            No credit card required
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-card border border-border rounded-[14px] bg-surface',
            },
          }}
        />
      </div>
    </div>
  )
}
