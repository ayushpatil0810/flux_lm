import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { WorkspaceView } from "@/components/workspace/workspace-view";
import { WorkspaceViewSkeleton } from "@/components/workspace/workspace-view-skeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}): Promise<Metadata> {
  const { workspaceId } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { title: "Workspace" };
    }
    const workspace = await WorkspaceService.getWorkspaceById(
      workspaceId,
      session.user.id,
    );
    return {
      title: workspace.title || "Workspace",
    };
  } catch {
    return {
      title: "Workspace",
    };
  }
}

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
