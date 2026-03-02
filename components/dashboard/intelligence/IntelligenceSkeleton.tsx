import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MarketValueSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-10 w-56 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function VisibilityScoreSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="h-4 w-44 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-center my-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-2 w-full bg-muted rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SkillsGapSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="h-4 w-52 bg-muted rounded animate-pulse" />
        <div className="h-3 w-36 bg-muted rounded animate-pulse mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between gap-2">
              <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
              <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicationPerformanceSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BestTimeToApplySkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="h-4 w-36 bg-muted rounded animate-pulse" />
        <div className="h-3 w-48 bg-muted rounded animate-pulse mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
