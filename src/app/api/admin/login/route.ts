import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

// Admin session cookie name (also checked in proxy.ts)
export const ADMIN_COOKIE = 'mayil_admin_session'
const COOKIE_MAX_AGE_S = 60 * 60 * 8  // 8 hours

export async function POST(req: NextRequest): Promise<NextResponse> {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  if (!passwordHash) {
    console.error('[admin-login] ADMIN_PASSWORD_HASH not set')
    return NextResponse.json({ error: 'Admin auth not configured' }, { status: 500 })
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { password } = body
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const valid = await bcrypt.compare(password, passwordHash)
  if (!valid) {
    // Generic message — don't leak whether the account exists
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Set HttpOnly, Secure, SameSite=Strict cookie
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: COOKIE_MAX_AGE_S,
  })

  return NextResponse.json({ ok: true })
}
