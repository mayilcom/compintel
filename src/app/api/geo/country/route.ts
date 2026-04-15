import { NextRequest, NextResponse } from 'next/server'

// Country code → display name for the onboarding dropdown
const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom',
  AE: 'UAE',   SG: 'Singapore',    AU: 'Australia',
  CA: 'Canada', DE: 'Germany',     FR: 'France',
  NL: 'Netherlands', NZ: 'New Zealand', ZA: 'South Africa',
  NG: 'Nigeria', KE: 'Kenya',      BR: 'Brazil',
  JP: 'Japan',  KR: 'South Korea', ID: 'Indonesia',
  PH: 'Philippines', MY: 'Malaysia',
}

/**
 * GET /api/geo/country
 * Returns the caller's country code from Vercel's edge headers.
 * No external API call — Vercel injects x-vercel-ip-country on every request.
 */
export async function GET(req: NextRequest) {
  const code = req.headers.get('x-vercel-ip-country') ?? ''
  const name = COUNTRY_NAMES[code] ?? null
  return NextResponse.json({ code, name })
}
