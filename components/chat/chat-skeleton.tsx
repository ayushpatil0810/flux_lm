import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="bg-background flex h-full w-full overflow-hidden">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-hidden p-4">
        <div className="flex w-full max-w-3xl flex-1 flex-col justify-end gap-6 pb-6">
          <div className="flex w-full justify-end">
            <Skeleton className="h-12 w-[60%] rounded-2xl" />
          </div>
          <div className="flex w-full justify-start">
            <Skeleton className="h-32 w-[85%] rounded-2xl" />
          </div>
        </div>

        <div className="w-full max-w-3xl shrink-0 px-4 pt-2 pb-6 md:px-8">
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
