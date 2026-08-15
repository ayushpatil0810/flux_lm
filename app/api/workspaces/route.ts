import { WorkspaceController } from "@/server/modules/workspace/workspace.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return WorkspaceController.listWorkspaces(req);
}

export async function POST(req: NextRequest) {
  return WorkspaceController.createWorkspace(req);
}
