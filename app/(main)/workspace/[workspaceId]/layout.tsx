import { Suspense } from "react";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { LoadingState } from "@/components/shell/states";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingState label="Loading workspace" />}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}
