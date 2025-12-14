import { Skeleton } from "@/components/ui/skeleton"

export function EventsPageSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 items-start">
          <div className="w-80 flex-shrink-0">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
