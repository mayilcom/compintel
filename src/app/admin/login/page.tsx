'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/admin/briefs')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Incorrect password.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-xl text-ink">Mayil</p>
          <p className="text-[13px] text-muted mt-1">Internal admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="label-section">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoFocus
              disabled={loading}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-[13px] text-threat">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-9 rounded-[8px] bg-gold text-white text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
