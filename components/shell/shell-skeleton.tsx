export function ShellSkeleton() {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
      {/* Topbar skeleton */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/30 px-5">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-muted animate-pulse" />
          <div className="size-8 rounded-lg bg-muted animate-pulse" />
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex h-full w-full items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-r-transparent" />
        </div>
      </main>
    </div>
  );
}
