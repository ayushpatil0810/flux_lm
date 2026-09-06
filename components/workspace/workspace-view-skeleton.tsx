import { Skeleton } from "@/components/ui/skeleton";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";

export function WorkspaceViewSkeleton() {
  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Topbar Skeleton */}
      <header className="border-border/30 flex h-12 shrink-0 items-center justify-between border-b px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-8 w-24 rounded-md md:block" />
          <Skeleton className="hidden h-8 w-24 rounded-md md:block" />
          <Skeleton className="size-8 rounded-md" />
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
