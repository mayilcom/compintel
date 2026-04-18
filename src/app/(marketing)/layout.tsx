import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-body">
      <MarketingNav />

      <main>{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="font-display text-base text-ink shrink-0">Mayil</Link>
          <div className="flex flex-wrap gap-x-10 gap-y-6 text-xs text-muted">
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Solutions</span>
              <Link href="/solutions/fmcg" className="hover:text-ink transition-colors">FMCG & CPG</Link>
              <Link href="/solutions/ecommerce" className="hover:text-ink transition-colors">Ecommerce & D2C</Link>
              <Link href="/solutions/tech" className="hover:text-ink transition-colors">Tech & SaaS</Link>
              <Link href="/solutions/agency" className="hover:text-ink transition-colors">Agencies</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Resources</span>
              <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
              <Link href="/use-cases" className="hover:text-ink transition-colors">Use Cases</Link>
              <Link href="/case-studies" className="hover:text-ink transition-colors">Case Studies</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-section mb-1">Company</span>
              <Link href="/contact" className="hover:text-ink transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-xs text-muted shrink-0">© {new Date().getFullYear()} Mayil.</p>
        </div>
      </footer>
    </div>
  )
}
