import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE } from '@/app/api/admin/login/route'

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}
