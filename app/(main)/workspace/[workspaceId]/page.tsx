import { Suspense } from "react";
import { WorkspaceView } from "@/components/workspace/workspace-view";

export const instant = false;

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return (
    <Suspense>
      <WorkspaceView workspaceId={workspaceId} />
    </Suspense>
  );
}
