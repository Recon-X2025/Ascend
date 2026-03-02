import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <div className="ascend-card flex items-start gap-3 p-4">
      <Skeleton className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/3 mt-2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
