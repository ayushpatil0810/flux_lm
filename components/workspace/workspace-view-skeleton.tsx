import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon as Settings } from "@hugeicons/core-free-icons";

export function WorkspaceViewSkeleton() {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Skeleton */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/30 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
          <button
            type="button"
            disabled
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-50"
          >
            <HugeiconsIcon icon={Settings} className="size-4" />
          </button>
        </header>

        {/* Chat Area Skeleton */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden p-4">
          <div className="w-full max-w-3xl flex-1 flex flex-col justify-end gap-6 pb-6">
            <div className="flex w-full flex-col gap-2">
              <div className="h-20 w-3/4 rounded-2xl rounded-tl-sm bg-muted animate-pulse" />
            </div>
            <div className="flex w-full flex-col gap-2 items-end">
              <div className="h-12 w-1/2 rounded-2xl rounded-tr-sm bg-primary/20 animate-pulse" />
            </div>
          </div>
          <div className="w-full max-w-3xl h-14 rounded-full border bg-muted/50 animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
}
