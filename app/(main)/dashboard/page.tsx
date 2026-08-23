import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { DashboardClient } from "./dashboard-client";
import type { Workspace } from "@/lib/api";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return null; // Handled by proxy.ts middleware redirect
  }

  const rawWorkspaces = await WorkspaceService.getUserWorkspaces(session.user.id);
  
  // Serialize dates for Client Component
  const workspaces: Workspace[] = rawWorkspaces.map(ws => ({
    ...ws,
    createdAt: ws.createdAt.toISOString(),
    updatedAt: ws.updatedAt.toISOString(),
  }));

  return <DashboardClient initialWorkspaces={workspaces} />;
}
