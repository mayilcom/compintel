import { NextRequest, NextResponse } from 'next/server'

export interface GeoResult {
  country_code: string   // ISO 3166-1 alpha-2, e.g. "IN"
  country_name: string
  is_vpn: boolean
  is_proxy: boolean
  currency: 'INR' | 'USD' | 'EUR'
  gateway: 'razorpay' | 'stripe'
}

function getClientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for; first IP is the real client
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}

function currencyForCountry(countryCode: string): 'INR' | 'USD' | 'EUR' {
  const EUR_COUNTRIES = new Set([
    'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI',
    'FR','GR','HR','HU','IE','IT','LT','LU','LV','MT',
    'NL','PL','PT','RO','SE','SI','SK',
  ])
  if (countryCode === 'IN') return 'INR'
  if (EUR_COUNTRIES.has(countryCode)) return 'EUR'
  return 'USD'
}

export async function GET(req: NextRequest): Promise<NextResponse<GeoResult>> {
  const ip = getClientIp(req)

  // Localhost fallback — treat as India for local dev
  if (ip === '127.0.0.1' || ip === '::1') {
    return NextResponse.json({
      country_code: 'IN',
      country_name: 'India',
      is_vpn: false,
      is_proxy: false,
      currency: 'INR',
      gateway: 'razorpay',
    })
  }

  const apiKey = process.env.IPQUALITYSCORE_API_KEY
  if (!apiKey) {
    // If no API key, fall back to India defaults rather than blocking checkout
    console.warn('[geo] IPQUALITYSCORE_API_KEY not set — defaulting to India/Razorpay')
    return NextResponse.json({
      country_code: 'IN',
      country_name: 'India',
      is_vpn: false,
      is_proxy: false,
      currency: 'INR',
      gateway: 'razorpay',
    })
  }

  try {
    const res = await fetch(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}?strictness=1&allow_public_access_points=true`,
      { next: { revalidate: 3600 } }  // Cache per-IP for 1 hour
    )

    if (!res.ok) throw new Error(`IPQualityScore HTTP ${res.status}`)

    const data = await res.json()

    const countryCode: string = data.country_code ?? 'US'
    const isVpn: boolean = data.vpn === true
    const isProxy: boolean = data.proxy === true || data.tor === true

    // VPN detection rule (PRD §15):
    // Indian IP + VPN detected → show USD pricing (stripe), not INR
    const isIndianButVpn = countryCode === 'IN' && (isVpn || isProxy)
    const effectiveCountry = isIndianButVpn ? 'US' : countryCode

    const currency = currencyForCountry(effectiveCountry)
    const gateway: 'razorpay' | 'stripe' =
      effectiveCountry === 'IN' ? 'razorpay' : 'stripe'

    return NextResponse.json({
      country_code: countryCode,
      country_name: data.country_name ?? countryCode,
      is_vpn: isVpn,
      is_proxy: isProxy,
      currency,
      gateway,
    })
  } catch (err) {
    console.error('[geo] IPQualityScore error:', err)
    // Safe fallback: show USD/Stripe — better to miss an Indian user
    // than to incorrectly show INR pricing to an international VPN user
    return NextResponse.json({
      country_code: 'US',
      country_name: 'United States',
      is_vpn: false,
      is_proxy: false,
      currency: 'USD',
      gateway: 'stripe',
    })
  }
}
