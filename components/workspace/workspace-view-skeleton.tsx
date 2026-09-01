import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceViewSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Topbar Skeleton */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md hidden md:block" />
          <Skeleton className="h-8 w-24 rounded-md hidden md:block" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </header>

      {/* Three-column body skeleton */}
      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {/* Left Panel Skeleton (Sources) */}
        <div className="hidden w-[280px] shrink-0 flex-col border-r border-border/30 md:flex p-4 gap-4">
           <Skeleton className="h-8 w-full rounded-md" />
           <Skeleton className="h-12 w-full rounded-lg" />
           <Skeleton className="h-12 w-full rounded-lg" />
           <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Center (Chat) Skeleton */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden items-center p-4">
           <div className="w-full max-w-3xl flex-1 flex flex-col justify-end gap-6 pb-6">
              <div className="flex w-full justify-end">
                <Skeleton className="h-12 w-[60%] rounded-2xl" />
              </div>
              <div className="flex w-full justify-start">
                <Skeleton className="h-32 w-[85%] rounded-2xl" />
              </div>
           </div>
           
           {/* Composer Skeleton */}
           <div className="w-full max-w-3xl shrink-0 px-4 md:px-8 pb-6 pt-2">
             <Skeleton className="h-32 w-full rounded-2xl" />
           </div>
        </main>
      </div>
    </div>
  );
}
