import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getAllContent, getContentBySlug } from '@/lib/mdx'
import Link from 'next/link'

export async function generateStaticParams() {
  return getAllContent('blog').map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getContentBySlug('blog', slug)
  if (!post) return {}
  return {
    title: `${post.frontmatter.title} — Mayil`,
    description: post.frontmatter.description,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getContentBySlug('blog', slug)

  if (!post || post.frontmatter.status !== 'published') notFound()

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="text-[12px] text-muted hover:text-ink transition-colors mb-8 block">
        ← All articles
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          {post.frontmatter.category && (
            <span className="text-[11px] rounded-full bg-surface-2 border border-border px-2.5 py-1 text-muted">
              {post.frontmatter.category}
            </span>
          )}
          <span className="text-[12px] text-muted">
            {new Date(post.frontmatter.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <h1 className="font-display text-3xl text-ink leading-snug mb-4">
          {post.frontmatter.title}
        </h1>
        <p className="text-[15px] text-muted leading-relaxed">
          {post.frontmatter.description}
        </p>
      </div>

      <hr className="border-border mb-10" />

      <div className="prose-mayil">
        <MDXRemote
          source={post.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <p className="text-[13px] text-muted mb-4">
          Mayil delivers a weekly competitive intelligence brief — tracking 12+ channels across every competitor you follow.
        </p>
        <div className="flex gap-3">
          <Link
            href="/sign-up"
            className="rounded-[8px] bg-ink text-paper px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Start free trial →
          </Link>
          <Link
            href="/blog"
            className="rounded-[8px] border border-border px-4 py-2 text-[13px] text-muted hover:text-ink transition-colors"
          >
            More articles
          </Link>
        </div>
      </div>
    </div>
  )
}
