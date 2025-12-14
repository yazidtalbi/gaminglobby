import { Skeleton } from "@/components/ui/skeleton"

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Banner skeleton */}
      <div className="h-48 md:h-56 lg:h-64 w-full bg-slate-800/50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Profile Info */}
          <div className="lg:col-span-4 lg:sticky lg:top-40 lg:self-start lg:pt-0">
            <div className="bg-slate-800/50 border border-slate-700/50 p-6 relative">
              {/* Avatar skeleton */}
              <div className="relative mb-6 -mt-20 z-0">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>

              {/* Name skeleton */}
              <div className="mb-4">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>

              {/* Status skeleton */}
              <div className="mb-4">
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Details skeleton */}
              <div className="space-y-3 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Action buttons skeleton */}
              <div className="space-y-2 mb-6">
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Stats skeleton */}
              <div className="pt-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Tabs skeleton */}
            <div className="mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-6">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
