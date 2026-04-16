'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-4 py-12 items-center text-center">
      <p className="text-sm font-medium text-ink">Failed to load dashboard</p>
      <p className="text-[13px] text-muted max-w-sm">
        {error.message ?? 'Something went wrong fetching your data.'}
      </p>
      <Button size="sm" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
