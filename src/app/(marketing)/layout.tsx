import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-body">
      <MarketingNav />

      <main>{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-12 py-16 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="font-display text-xl text-ink shrink-0">Mayil</Link>
          <div className="flex flex-wrap gap-x-14 gap-y-8 text-sm text-muted">
            <div className="flex flex-col gap-3">
              <span className="label-section mb-1">Platform</span>
              <Link href="/product" className="hover:text-ink transition-colors">Overview</Link>
              <Link href="/product#sample-brief" className="hover:text-ink transition-colors">The brief</Link>
              <Link href="/product#channels" className="hover:text-ink transition-colors">Channels</Link>
              <Link href="/product#data-handling" className="hover:text-ink transition-colors">Data &amp; security</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label-section mb-1">Solutions</span>
              <Link href="/solutions/fmcg" className="hover:text-ink transition-colors">FMCG &amp; CPG</Link>
              <Link href="/solutions/ecommerce" className="hover:text-ink transition-colors">Ecommerce &amp; D2C</Link>
              <Link href="/solutions/tech" className="hover:text-ink transition-colors">Tech &amp; SaaS</Link>
              <Link href="/solutions/agency" className="hover:text-ink transition-colors">Agencies</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label-section mb-1">Resources</span>
              <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
              <Link href="/use-cases" className="hover:text-ink transition-colors">Use Cases</Link>
              <Link href="/case-studies" className="hover:text-ink transition-colors">Case Studies</Link>
              <Link href="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="label-section mb-1">Company</span>
              <Link href="/contact" className="hover:text-ink transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-sm text-muted shrink-0">© {new Date().getFullYear()} Mayil.</p>
        </div>
      </footer>
    </div>
  )
}
