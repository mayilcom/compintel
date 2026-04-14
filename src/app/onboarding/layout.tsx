import Link from 'next/link'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Minimal nav — no links during onboarding */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <span className="font-display text-lg text-ink">Mayil</span>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  )
}
