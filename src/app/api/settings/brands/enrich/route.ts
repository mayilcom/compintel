import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface EnrichResult {
  domain:       string | null
  instagram:    string | null
  facebook:     string | null
  youtube:      string | null
  linkedin:     string | null
  google_search: string | null
  amazon:       string | null // comma-separated ASINs
}

/**
 * POST /api/settings/brands/enrich
 * Uses Claude Haiku to suggest channel handles for a competitor brand.
 * Body: { brand_name: string, category?: string | null, domain?: string | null }
 * Returns: EnrichResult
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { brand_name?: string; category?: string | null; domain?: string | null }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const brandName = body.brand_name?.trim()
  if (!brandName) return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })

  const category = body.category ?? null
  const domain   = body.domain   ?? null

  const prompt = `You are a research assistant helping configure a competitive intelligence tool for an Indian market brand.

Brand name: ${brandName}
${category ? `Category/industry: ${category}` : ''}
${domain ? `Known website domain: ${domain}` : ''}

Based on publicly available information, suggest the following for this brand. Return ONLY a JSON object — no explanation, no markdown, no code block wrapper.

{
  "domain": "website domain only (e.g. britannia.co.in) or null if unknown",
  "instagram": "@handle only (no URL) or null",
  "facebook": "facebook page handle/slug (e.g. BritanniaIndustries) or null",
  "youtube": "@channelhandle (no URL) or null",
  "linkedin": "company slug as it appears in linkedin.com/company/SLUG or null",
  "google_search": "website domain to use for Google Ads lookup (same as domain if known) or null",
  "amazon": "comma-separated ASINs of their main products on amazon.in (e.g. B09XYZ123, B08ABC456) — only real 10-char ASINs starting with B, or null if none known"
}

Rules:
- Only include values you are highly confident about. Use null for anything uncertain.
- For amazon: only include ASINs you are sure exist on amazon.in. If unsure, return null.
- For domain and google_search: return just the domain (no https://, no www., no trailing slash).
- This is for a competitive intelligence tool tracking Indian brands, so prefer indian-market handles.`

  try {
    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''

    // Strip markdown code blocks if Haiku wraps in them
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let result: EnrichResult
    try {
      result = JSON.parse(cleaned) as EnrichResult
    } catch {
      return NextResponse.json({ error: 'AI returned unparseable response', raw: text }, { status: 502 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[enrich] Claude API error:', err)
    return NextResponse.json({ error: 'AI enrichment failed' }, { status: 502 })
  }
}
