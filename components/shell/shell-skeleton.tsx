import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the dashboard content (greeting header, new workspace dashed tile, and workspace cards grid).
 * Matches the layout and card dimensions of DashboardClient.
 */
export function DashboardContentSkeleton() {
  return (
    <div className="relative min-h-full">
      {/* Subtle background texture matching dashboard */}
      <div className="bg-grid absolute inset-0 z-0 opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-3.5 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12 pb-safe">
        {/* Header Section: Greeting + Counter */}
        <section className="relative mb-6 sm:mb-8 flex flex-col gap-2 pt-2 sm:pt-4">
          <Skeleton className="h-8 sm:h-9 md:h-10 w-52 sm:w-72 md:w-80 rounded-xl" />
          <Skeleton className="h-4 w-24 sm:w-32 rounded-md" />
        </section>

        {/* Workspace Grid Section */}
        <section className="flex flex-col">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* New Workspace Dashed Tile */}
            <div className="relative flex min-h-[11rem] sm:min-h-[12rem] flex-col justify-between rounded-2xl border-2 border-dashed border-foreground/25 bg-card/60 p-4 sm:p-5 shadow-xs">
              <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-foreground/25 bg-background/80">
                <Skeleton className="size-5 rounded-md" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
            </div>

            {/* Workspace Card Skeletons */}
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="relative flex min-h-[11rem] sm:min-h-[12rem] flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="size-7 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-3.5 w-full rounded-sm" />
                    <Skeleton className="h-3.5 w-2/3 rounded-sm" />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20 rounded-sm" />
                  <Skeleton className="h-3.5 w-12 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Top-level application shell skeleton.
 * Matches the split-edge pill navigation and current dashboard layout.
 */
export function ShellSkeleton() {
  return (
    <div className="bg-background relative flex h-dvh w-full flex-col overflow-hidden">
      {/* ── Topbar Skeleton (Split-edge pill design) ── */}
      <header className="pointer-events-none sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 pt-3 pb-2 sm:gap-4 sm:pt-4">
        {/* Left Pill: Brand Logo & Text */}
        <div className="pointer-events-auto shrink-0">
          <div className="flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:pl-5 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="size-6 shrink-0 rounded-sm sm:size-6.5" />
            <Skeleton className="h-4 w-9 rounded-sm" />
          </div>
        </div>

        {/* Center Pill: Search Pill */}
        <div className="pointer-events-auto flex flex-1 items-center justify-center px-1 sm:px-2">
          <div className="group relative flex h-10 w-full max-w-[200px] items-center rounded-full border border-border/80 bg-background/85 px-3 shadow-xs backdrop-blur-md xs:max-w-[260px] sm:h-11 sm:max-w-sm md:max-w-md dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="ml-2.5 h-3.5 w-24 sm:w-36 rounded-sm" />
            <Skeleton className="ml-auto hidden h-5 w-9 rounded border border-border/80 sm:block" />
          </div>
        </div>

        {/* Right Pill: Theme toggle + User avatar */}
        <div className="pointer-events-auto shrink-0">
          <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="size-7.5 shrink-0 rounded-full" />
            <div
              aria-hidden="true"
              className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
            />
            <Skeleton className="size-8.5 shrink-0 rounded-full" />
          </div>
        </div>
      </header>

      {/* ── Dashboard Content ── */}
      <main className="no-scrollbar relative flex-1 overflow-y-auto">
        <DashboardContentSkeleton />
      </main>
    </div>
  );
}
