import { Suspense } from "react";
import { WorkspaceShell } from "@/components/shell/workspace-shell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}
