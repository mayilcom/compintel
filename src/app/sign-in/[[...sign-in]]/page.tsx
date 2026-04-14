import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl text-ink">Mayil</span>
          <p className="mt-2 text-[13px] text-muted">
            Sign in to your workspace
          </p>
        </div>
        <SignIn
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
