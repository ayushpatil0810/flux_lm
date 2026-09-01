import { Suspense } from "react";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { WorkspaceViewSkeleton } from "@/components/workspace/workspace-view-skeleton";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<WorkspaceViewSkeleton />}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}
