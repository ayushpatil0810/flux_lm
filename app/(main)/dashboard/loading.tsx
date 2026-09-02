import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8 md:py-10">
      <section className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Skeleton cards to match the workspace grid */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border/50 bg-card/40 flex min-h-[12rem] flex-col justify-between overflow-hidden rounded-2xl border p-5"
            >
              <div className="relative z-20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="bg-primary/10 size-11 rounded-xl" />
                  <Skeleton className="size-8 rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-end">
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
