import { Suspense } from "react";
import { WorkspaceView } from "@/components/workspace/workspace-view";
import { WorkspaceViewSkeleton } from "@/components/workspace/workspace-view-skeleton";
export const instant = false;

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return (
    <Suspense fallback={<WorkspaceViewSkeleton />}>
      <WorkspaceView workspaceId={workspaceId} />
    </Suspense>
  );
}
