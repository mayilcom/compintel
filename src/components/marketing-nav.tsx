'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SOLUTIONS = [
  { label: 'FMCG & CPG', href: '/solutions/fmcg', description: 'Track SKUs, festive campaigns, Amazon ratings' },
  { label: 'Ecommerce & D2C', href: '/solutions/ecommerce', description: 'Meta ad spend, quick commerce, Instagram' },
  { label: 'Tech & SaaS', href: '/solutions/tech', description: 'Feature launches, pricing changes, Google Ads' },
  { label: 'Agencies', href: '/solutions/agency', description: 'Multi-client workspace, white-label briefs' },
]

const RESOURCES = [
  { label: 'Blog', href: '/blog', description: 'Competitive intelligence articles and guides' },
  { label: 'Use Cases', href: '/use-cases', description: 'How teams use Mayil in practice' },
  { label: 'Case Studies', href: '/case-studies', description: 'Results from the field' },
]

function NavDropdown({
  label,
  items,
  baseHref,
}: {
  label: string
  items: { label: string; href: string; description: string }[]
  baseHref: string
}) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(baseHref)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 text-[13px] transition-colors outline-none',
            isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'
          )}
        >
          {label}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-px opacity-50">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-[10px] border border-border bg-surface shadow-lg p-1.5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {items.map(item => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block rounded-[7px] px-3 py-2.5 outline-none hover:bg-gold-bg transition-colors group"
              >
                <p className="text-[13px] font-medium text-ink group-hover:text-gold-dark transition-colors">{item.label}</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{item.description}</p>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="font-display text-lg text-ink hover:opacity-80 transition-opacity shrink-0">
          Mayil
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavDropdown label="Solutions" items={SOLUTIONS} baseHref="/solutions" />
          <NavDropdown label="Resources" items={RESOURCES} baseHref="/blog" />
          <Link href="/product" className="text-[13px] text-muted hover:text-ink transition-colors">
            Product
          </Link>
          <Link href="/pricing" className="text-[13px] text-muted hover:text-ink transition-colors">
            Pricing
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden md:block text-[13px] text-muted hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up?plan=growth">
            <Button size="sm">Start free trial</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
