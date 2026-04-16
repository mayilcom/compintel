export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-28 rounded-[6px] bg-surface-2" />
          <div className="h-4 w-40 rounded-[6px] bg-surface-2" />
        </div>
        <div className="h-8 w-28 rounded-[6px] bg-surface-2" />
      </div>
      {/* Status card skeleton */}
      <div className="h-28 rounded-[10px] bg-surface-2 border border-border" />
      {/* Table skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-36 rounded bg-surface-2" />
        <div className="h-48 rounded-[10px] bg-surface-2 border border-border" />
      </div>
    </div>
  )
}
