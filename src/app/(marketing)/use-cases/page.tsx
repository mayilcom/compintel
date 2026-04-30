import { getAllContent } from '@/lib/mdx'
import Link from 'next/link'

export const metadata = { title: 'Use Cases — Mayil', description: 'Real competitive scenarios and how Mayil surfaces the signals that matter.' }

const CATEGORY_ORDER = ['FMCG', 'Ecommerce', 'Tech', 'Agency']

export default function UseCasesPage() {
  const items = getAllContent('use-cases')

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof items>>((acc, cat) => {
    const matches = items.filter(i => i.frontmatter.category === cat)
    if (matches.length) acc[cat] = matches
    return acc
  }, {})

  const uncategorised = items.filter(i => !CATEGORY_ORDER.includes(i.frontmatter.category ?? ''))
  if (uncategorised.length) grouped['Other'] = uncategorised

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <p className="label-section mb-3">Use cases</p>
        <h1 className="font-display text-3xl text-ink">How teams use Mayil</h1>
        <p className="mt-3 text-[14px] text-muted max-w-xl">
          Real competitive scenarios, the signals that surface them, and how brand teams respond.
        </p>
      </div>

      {Object.entries(grouped).map(([category, cases]) => (
        <div key={category} className="mb-12">
          <p className="label-section mb-4">{category}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {cases.map(item => (
              <Link key={item.slug} href={`/use-cases/${item.slug}`} className="group block">
                <div className="rounded-[10px] border border-border bg-surface p-6 h-full hover:border-gold/40 transition-colors">
                  <h2 className="font-display text-[17px] text-ink mb-2 leading-snug group-hover:text-gold-dark transition-colors">
                    {item.frontmatter.title}
                  </h2>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {item.frontmatter.description}
                  </p>
                  <p className="mt-4 text-[12px] text-gold-dark font-medium">Read use case →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-[14px] text-muted">Use cases coming soon.</p>
      )}

      <div className="mt-8 rounded-[14px] border border-border bg-surface-2 p-8 text-center">
        <h2 className="font-display text-xl text-ink mb-2">Ready to track your competitors?</h2>
        <p className="text-[13px] text-muted mb-6">14-day free trial. Card required at signup. Cancel any time before day 14.</p>
        <Link
          href="/sign-up?plan=growth"
          className="inline-block rounded-[8px] bg-ink text-paper px-6 py-2.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          Start free trial →
        </Link>
      </div>
    </div>
  )
}
