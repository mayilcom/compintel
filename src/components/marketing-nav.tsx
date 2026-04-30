'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PLATFORM = [
  { label: 'Overview',         href: '/product',                  description: 'How Mayil turns weekly competitor activity into a single brief' },
  { label: 'The brief',        href: '/product#sample-brief',     description: 'Sample brief — what lands in your inbox on Sunday' },
  { label: 'Channels',         href: '/product#channels',         description: 'What we collect: Instagram, Meta Ads, Amazon, Google News, Search Ads' },
  { label: 'Data & security',  href: '/product#data-handling',    description: 'Where data lives, retention, sub-processors, GDPR posture' },
]

const SOLUTIONS = [
  { label: 'FMCG & CPG',       href: '/solutions/fmcg',      description: 'Track competitor SKUs, festive campaigns, Amazon ratings' },
  { label: 'Ecommerce & D2C',  href: '/solutions/ecommerce', description: 'Meta ad spend, quick commerce, Instagram coverage' },
  { label: 'Tech & SaaS',      href: '/solutions/tech',      description: 'Feature launches, pricing changes, paid search activity' },
  { label: 'Agencies',         href: '/solutions/agency',    description: 'Multi-client workspace, white-label briefs' },
]

const RESOURCES = [
  { label: 'Blog',         href: '/blog',         description: 'Competitive intelligence articles and guides' },
  { label: 'Use Cases',    href: '/use-cases',    description: 'How teams use Mayil in practice' },
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
            'flex items-center gap-1.5 text-base transition-colors outline-none',
            isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'
          )}
        >
          {label}
          <svg width="11" height="7" viewBox="0 0 10 6" fill="none" className="mt-0.5 opacity-60">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={12}
          className="z-50 min-w-[300px] rounded-[12px] border border-border bg-surface shadow-lg p-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {items.map(item => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block rounded-[8px] px-3.5 py-3 outline-none hover:bg-gold-bg transition-colors group"
              >
                <p className="text-[15px] font-medium text-ink group-hover:text-gold-dark transition-colors">{item.label}</p>
                <p className="text-[13px] text-muted mt-1 leading-relaxed">{item.description}</p>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function MarketingNav() {
  const pathname = usePathname()
  const pricingActive = pathname === '/pricing' || pathname.startsWith('/pricing/')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 md:px-10 lg:px-12">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl text-ink hover:opacity-80 transition-opacity shrink-0">
          Mayil
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-9">
          <NavDropdown label="Platform"  items={PLATFORM}  baseHref="/product"   />
          <NavDropdown label="Solutions" items={SOLUTIONS} baseHref="/solutions" />
          <NavDropdown label="Resources" items={RESOURCES} baseHref="/blog"      />
          <Link
            href="/pricing"
            className={cn(
              'text-base transition-colors',
              pricingActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'
            )}
          >
            Pricing
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="hidden md:block text-base text-muted hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up?plan=growth">
            <Button size="lg">Free trial</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
