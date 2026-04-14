'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/admin/briefs', label: 'Briefs' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/lookup', label: 'Brand lookup' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface-2/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/briefs" className="font-display text-base text-ink">
              Mayil
            </Link>
            <span className="label-section text-threat">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                    active
                      ? 'bg-gold-bg text-gold-dark font-medium'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <form action="/api/admin/logout" method="POST">
            <button className="text-[11px] text-muted hover:text-ink transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
