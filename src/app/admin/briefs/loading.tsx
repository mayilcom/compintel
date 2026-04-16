export default function AdminBriefsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-16 rounded-[6px] bg-surface-2" />
          <div className="h-4 w-56 rounded-[6px] bg-surface-2" />
        </div>
      </div>
      <div className="flex gap-2 border-b border-border pb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-[6px] bg-surface-2" />
        ))}
      </div>
      <div className="rounded-[10px] border border-border overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-border last:border-0 bg-surface-2/50" />
        ))}
      </div>
    </div>
  )
}
