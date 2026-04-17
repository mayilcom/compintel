import { getAllContent } from '@/lib/mdx'
import Link from 'next/link'

export const metadata = { title: 'Case Studies — Mayil', description: 'How brand teams and agencies use Mayil to stay ahead of competitors.' }

export default function CaseStudiesPage() {
  // Only shows published — all current case studies are hidden until real customers available
  const items = getAllContent('case-studies')

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <p className="label-section mb-3">Case studies</p>
        <h1 className="font-display text-3xl text-ink">Results from the field</h1>
        <p className="mt-3 text-[14px] text-muted max-w-xl">
          How brand teams and agencies use Mayil to catch competitor moves early and act with confidence.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map(item => (
            <Link key={item.slug} href={`/case-studies/${item.slug}`} className="group block">
              <div className="rounded-[10px] border border-border bg-surface p-6 h-full hover:border-gold/40 transition-colors">
                {item.frontmatter.industry && (
                  <span className="text-[11px] rounded-full bg-surface-2 border border-border px-2.5 py-1 text-muted mb-3 inline-block capitalize">
                    {item.frontmatter.industry}
                  </span>
                )}
                <h2 className="font-display text-[17px] text-ink mb-2 leading-snug group-hover:text-gold-dark transition-colors mt-2">
                  {item.frontmatter.title}
                </h2>
                {item.frontmatter.result && (
                  <p className="text-[12px] text-opportunity font-medium mb-3">
                    {item.frontmatter.result}
                  </p>
                )}
                <p className="text-[13px] text-muted leading-relaxed">
                  {item.frontmatter.description}
                </p>
                <p className="mt-4 text-[12px] text-gold-dark font-medium">
                  {item.frontmatter.gated ? 'Download case study →' : 'Read case study →'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-border bg-surface-2 p-12 text-center">
          <h2 className="font-display text-xl text-ink mb-2">Case studies coming soon</h2>
          <p className="text-[13px] text-muted mb-6 max-w-md mx-auto">
            We&apos;re documenting results from our early customers. In the meantime, request a demo and we&apos;ll walk you through examples from your industry.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-[8px] bg-ink text-paper px-6 py-2.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Request a demo →
          </Link>
        </div>
      )}
    </div>
  )
}
