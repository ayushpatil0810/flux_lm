export function ShellSkeleton() {
  return (
    <div className="bg-background flex h-svh w-full flex-col overflow-hidden">
      {/* Topbar skeleton */}
      <div className="border-border/30 flex h-14 shrink-0 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-muted size-6 animate-pulse rounded" />
          <div className="bg-muted h-5 w-16 animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted size-8 animate-pulse rounded-lg" />
          <div className="bg-muted size-8 animate-pulse rounded-lg" />
          <div className="bg-muted size-8 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="no-scrollbar flex-1 overflow-y-auto">
        <div className="flex h-full w-full items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-r-transparent" />
        </div>
      </main>
    </div>
  );
}
