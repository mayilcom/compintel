'use client'

import { Button } from '@/components/ui/button'

export default function AdminBriefsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-4 py-12 items-center text-center">
      <p className="text-sm font-medium text-ink">Failed to load briefs</p>
      <p className="text-[13px] text-muted max-w-sm font-mono text-xs">
        {error.digest ? `digest: ${error.digest}` : error.message}
      </p>
      <Button size="sm" variant="outline" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
