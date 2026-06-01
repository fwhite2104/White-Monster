import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'

export default function Loading() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
        <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
        <LoadingSkeleton count={4} />
      </div>
    </div>
  )
}
