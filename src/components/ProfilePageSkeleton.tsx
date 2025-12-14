import { Skeleton } from "@/components/ui/skeleton"

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-48 md:h-56 lg:h-64 w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
