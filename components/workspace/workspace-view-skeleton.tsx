import { Skeleton } from "@/components/ui/skeleton";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";

export function WorkspaceViewSkeleton() {
  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Topbar Skeleton */}
      <header className="pointer-events-none sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 pt-2.5 pb-2 transition-all sm:pt-3">
        {/* ── Left Pill: Back to Dashboard & Flux Brand ── */}
        <div className="pointer-events-auto shrink-0">
          <div className="flex h-11 items-center gap-1.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-2.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-3 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex items-center gap-2 pl-0.5">
              <Skeleton className="size-4.5 rounded-sm sm:size-5" />
              <Skeleton className="h-4 w-9 rounded-sm" />
            </div>
          </div>
        </div>

        {/* ── Center Pill: Workspace Title & Switcher ── */}
        <div className="pointer-events-auto flex flex-1 items-center justify-center px-1 sm:px-2">
          <div className="flex h-10 w-full max-w-[200px] items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-3 py-1 shadow-xs backdrop-blur-md xs:max-w-[260px] sm:h-11 sm:max-w-sm sm:gap-2 sm:px-3.5 md:max-w-md dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="hidden size-4 shrink-0 rounded-sm xs:block" />
            <Skeleton className="h-4 w-28 rounded-sm sm:w-36" />
            <Skeleton className="size-3.5 shrink-0 rounded-sm" />
          </div>
        </div>

        {/* ── Right Pill: Settings, Theme & User ── */}
        <div className="pointer-events-auto shrink-0">
          <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-3 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-4 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Skeleton className="size-8 rounded-full" />
            <div
              aria-hidden="true"
              className="h-3.5 w-px bg-border/60 dark:bg-border/40"
            />
            <Skeleton className="size-7.5 rounded-full" />
            <div
              aria-hidden="true"
              className="h-3.5 w-px bg-border/60 dark:bg-border/40"
            />
            <Skeleton className="size-8.5 rounded-full" />
          </div>
        </div>
      </header>

      {/* Three-column body skeleton */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Left Panel Skeleton (Sources) */}
        <div className="border-border/30 hidden w-[280px] shrink-0 flex-col gap-4 border-r p-4 md:flex">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Center (Chat) Skeleton */}
        <ChatSkeleton />
      </div>
    </div>
  );
}
