import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-body">
      <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="font-display text-lg text-ink hover:opacity-80 transition-opacity">
            Mayil
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <a href="mailto:hello@emayil.com" className="hover:text-ink transition-colors">hello@emayil.com</a>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-display text-base text-ink">Mayil</Link>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Mayil. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
