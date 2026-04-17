import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getAllContent, getContentBySlug } from '@/lib/mdx'
import Link from 'next/link'

export async function generateStaticParams() {
  return getAllContent('case-studies').map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getContentBySlug('case-studies', slug)
  if (!item) return {}
  return {
    title: `${item.frontmatter.title} — Mayil`,
    description: item.frontmatter.description,
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = getContentBySlug('case-studies', slug)

  if (!item || item.frontmatter.status !== 'published') notFound()

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/case-studies" className="text-[12px] text-muted hover:text-ink transition-colors mb-8 block">
        ← All case studies
      </Link>

      <div className="mb-10">
        {item.frontmatter.industry && (
          <span className="text-[11px] rounded-full bg-surface-2 border border-border px-2.5 py-1 text-muted mb-4 inline-block capitalize">
            {item.frontmatter.industry}
          </span>
        )}
        <h1 className="font-display text-3xl text-ink leading-snug mt-3 mb-4">
          {item.frontmatter.title}
        </h1>
        {item.frontmatter.result && (
          <div className="rounded-[10px] border border-opportunity/30 bg-[#EBF7EE] px-4 py-3 mb-4">
            <p className="text-[13px] text-opportunity font-medium">{item.frontmatter.result}</p>
          </div>
        )}
        <p className="text-[15px] text-muted leading-relaxed">
          {item.frontmatter.description}
        </p>
      </div>

      <hr className="border-border mb-10" />

      <div className="prose-mayil">
        <MDXRemote
          source={item.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <p className="text-[13px] text-muted mb-4">
          Want results like these? Start with a 14-day free trial or request a personalised demo.
        </p>
        <div className="flex gap-3">
          <Link
            href="/contact"
            className="rounded-[8px] bg-ink text-paper px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Request a demo →
          </Link>
          <Link
            href="/case-studies"
            className="rounded-[8px] border border-border px-4 py-2 text-[13px] text-muted hover:text-ink transition-colors"
          >
            More case studies
          </Link>
        </div>
      </div>
    </div>
  )
}
