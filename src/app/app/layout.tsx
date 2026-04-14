import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      {/* ── Top navigation ── */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-paper/92 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/app/dashboard" className="font-display text-lg text-ink hover:opacity-80 transition-opacity">
            Mayil
          </Link>

          {/* Primary nav links */}
          <AppNav />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                  userButtonPopoverCard: 'shadow-card border border-border rounded-[14px]',
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
