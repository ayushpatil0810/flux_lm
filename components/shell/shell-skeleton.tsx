import { SidebarProvider } from "@/components/ui/sidebar";

export function ShellSkeleton() {
  return (
    <SidebarProvider
      defaultOpen
      className="h-svh w-full overflow-hidden no-scrollbar"
      style={
        {
          "--sidebar-width": "18.125rem",
          "--sidebar-width-icon": "4.25rem",
        } as React.CSSProperties
      }
    >
      {/* Sidebar Skeleton */}
      <div className="flex h-full w-[18.125rem] flex-col border-r bg-sidebar p-4 hidden md:flex">
        <div className="flex items-center gap-2 mb-8 mt-2">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-10 w-full rounded-md bg-muted/50 animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted/50 animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted/50 animate-pulse" />
        </div>
        <div className="mt-auto h-12 w-full rounded-md bg-muted/50 animate-pulse" />
      </div>

      {/* Main Skeleton */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <div className="h-14 border-b flex items-center px-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex h-full w-full items-center justify-center">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-r-transparent" />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
