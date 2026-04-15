'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SETTINGS_NAV = [
  { label: 'Profile',               href: '/app/settings/profile' },
  { label: 'Team',                  href: '/app/settings/team' },
  { label: 'Brands & competitors',  href: '/app/settings/competitors' },
  { label: 'Connected channels',    href: '/app/settings/channels' },
  { label: 'Recipients',            href: '/app/settings/recipients' },
  { label: 'Delivery preferences',  href: '/app/settings/delivery' },
  { label: 'Subscription & billing',href: '/app/settings/subscription' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex gap-8">
      {/* ── Settings sidebar ── */}
      <aside className="w-48 shrink-0">
        <p className="label-section mb-3">Settings</p>
        <nav className="flex flex-col gap-0.5">
          {SETTINGS_NAV.map(({ label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-[8px] px-3 py-2 text-[13px] transition-colors',
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
      </aside>

      {/* ── Settings content ── */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
