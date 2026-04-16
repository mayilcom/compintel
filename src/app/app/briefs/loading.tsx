export default function BriefsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-7 w-20 rounded-[6px] bg-surface-2" />
        <div className="h-4 w-28 rounded-[6px] bg-surface-2" />
      </div>
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-[10px] bg-surface-2 border border-border" />
        ))}
      </div>
    </div>
  )
}
