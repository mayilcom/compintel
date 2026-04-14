'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/app/dashboard' },
  { label: 'Briefs',    href: '/app/briefs' },
  { label: 'Settings',  href: '/app/settings/profile' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {NAV_LINKS.map(({ label, href }) => {
        const isActive =
          href === '/app/dashboard'
            ? pathname === href
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-[8px] px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-gold-bg text-gold-dark font-medium'
                : 'text-muted hover:text-ink hover:bg-surface-2'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
