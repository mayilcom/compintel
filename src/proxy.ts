import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/onboarding(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Admin routes: check HttpOnly session cookie (set by /api/admin/login)
  if (isAdminRoute(req)) {
    // Allow the login page itself through — it's the entry point
    if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()

    const adminSession = req.cookies.get('mayil_admin_session')?.value
    if (adminSession !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // App + onboarding routes: require Clerk auth
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
