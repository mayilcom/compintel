import { getAllContent } from '@/lib/mdx'
import Link from 'next/link'

export const metadata = { title: 'Blog — Mayil', description: 'Thought leadership on competitive intelligence, FMCG strategy, and brand marketing.' }

export default function BlogPage() {
  const posts = getAllContent('blog')
  const featured = posts.find(p => p.frontmatter.featured)
  const rest = posts.filter(p => !p.frontmatter.featured)

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <p className="label-section mb-3">Blog</p>
        <h1 className="font-display text-3xl text-ink">Competitive intelligence, decoded.</h1>
        <p className="mt-3 text-[14px] text-muted max-w-xl">
          Strategy, signals, and frameworks for brand teams who track competitors seriously.
        </p>
      </div>

      {featured && (
        <Link href={`/blog/${featured.slug}`} className="group block mb-12">
          <div className="rounded-[14px] border border-gold/30 bg-gold-bg p-8 hover:border-gold/60 transition-colors">
            <span className="label-section text-gold-dark mb-3 block">Featured</span>
            <h2 className="font-display text-2xl text-ink mb-3 group-hover:text-gold-dark transition-colors">
              {featured.frontmatter.title}
            </h2>
            <p className="text-[14px] text-muted leading-relaxed mb-4">
              {featured.frontmatter.description}
            </p>
            <div className="flex items-center gap-3 text-[12px] text-muted">
              {featured.frontmatter.category && (
                <span className="rounded-full bg-surface border border-border px-2.5 py-1">
                  {featured.frontmatter.category}
                </span>
              )}
              <span>{new Date(featured.frontmatter.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <div className="rounded-[10px] border border-border bg-surface p-6 h-full hover:border-gold/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  {post.frontmatter.category && (
                    <span className="text-[11px] rounded-full bg-surface-2 border border-border px-2.5 py-1 text-muted">
                      {post.frontmatter.category}
                    </span>
                  )}
                  <span className="text-[11px] text-muted">
                    {new Date(post.frontmatter.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="font-display text-[18px] text-ink mb-2 leading-snug group-hover:text-gold-dark transition-colors">
                  {post.frontmatter.title}
                </h2>
                <p className="text-[13px] text-muted leading-relaxed">
                  {post.frontmatter.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <p className="text-[14px] text-muted">Articles coming soon.</p>
      )}
    </div>
  )
}
