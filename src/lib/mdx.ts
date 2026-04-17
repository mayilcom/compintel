import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export type ContentType = 'blog' | 'use-cases' | 'case-studies'

export interface FrontMatter {
  title:       string
  description: string
  date:        string
  category?:   string
  tags?:       string[]
  author?:     string
  gated?:      boolean
  featured?:   boolean
  status:      'draft' | 'published' | 'hidden'
  industry?:   string   // for case-studies: fmcg | ecommerce | tech | agency
  result?:     string   // for case-studies: one-line outcome
}

export interface ContentItem {
  slug:         string
  frontmatter:  FrontMatter
  content:      string
}

export function getContentSlugs(type: ContentType): string[] {
  const dir = path.join(CONTENT_DIR, type)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace(/\.mdx$/, ''))
}

export function getContentBySlug(type: ContentType, slug: string): ContentItem | null {
  const filePath = path.join(CONTENT_DIR, type, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)

  return {
    slug,
    frontmatter: data as FrontMatter,
    content,
  }
}

export function getAllContent(
  type: ContentType,
  opts: { includeHidden?: boolean } = {}
): ContentItem[] {
  const slugs = getContentSlugs(type)
  const items = slugs
    .map(slug => getContentBySlug(type, slug))
    .filter((item): item is ContentItem => item !== null)
    .filter(item => {
      if (opts.includeHidden) return item.frontmatter.status !== 'draft'
      return item.frontmatter.status === 'published'
    })
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())

  return items
}
