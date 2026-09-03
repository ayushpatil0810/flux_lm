import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-full">
      {/* Subtle background texture for the entire dashboard */}
      <div className="bg-grid absolute inset-0 z-0 opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-4 py-8 md:px-8 md:py-12">
        {/* Hero Section Skeleton */}
        <section className="relative mb-8 md:mb-10 flex flex-col items-start pt-4">
          <div className="glow-primary absolute -right-20 -top-20 -z-10 h-[400px] w-[600px] opacity-30 blur-[120px] pointer-events-none" />
          <Skeleton className="h-10 w-72 md:h-12 md:w-96 rounded-xl" />
        </section>

        {/* Workspace Grid Skeleton */}
        <section className="flex flex-col">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* New Workspace Skeleton Tile */}
            <div className="relative flex min-h-[12rem] flex-col justify-between rounded-2xl border-2 border-dashed border-foreground/20 bg-card/60 p-5">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
            </div>

            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="relative flex min-h-[12rem] flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5"
              >
                <div className="relative z-20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="size-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <div className="space-y-1.5 pt-1">
                      <Skeleton className="h-3.5 w-full rounded-md" />
                      <Skeleton className="h-3.5 w-2/3 rounded-md" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-8 flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
