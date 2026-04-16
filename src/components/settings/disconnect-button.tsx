'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DisconnectButton({ provider }: { provider: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDisconnect() {
    setLoading(true)
    try {
      await fetch('/api/oauth/disconnect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ provider }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={loading}
      className="ml-2 text-[11px] text-muted hover:text-threat transition-colors disabled:opacity-50"
    >
      {loading ? 'Disconnecting…' : 'Disconnect'}
    </button>
  )
}
