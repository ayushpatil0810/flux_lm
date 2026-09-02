"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { useWorkspace } from "@/hooks/use-workspaces";
import { CreateWorkspaceDialog } from "@/components/shell/create-workspace-dialog";

import { DashboardTopbar } from "@/components/shell/dashboard-topbar";
import { WorkspacePanelProvider } from "@/components/shell/workspace-panel-context";
import { WorkspaceContext } from "@/components/shell/workspace-context";
import { MemoriesSheet } from "@/components/memories/memories-sheet";

interface ShellProps {
  children: React.ReactNode;
}

/**
 * Authenticated application shell.
 *
 * - Workspace routes (/workspace/[id]): children only, no chrome.
 *   The workspace view manages its own topbar + panels.
 * - Dashboard route: slim topbar (no sidebar) + memories sheet overlay.
 */
export function Shell({ children }: ShellProps) {
  const [createOpen, setCreateOpen] = React.useState(false);

  const [memoriesOpen, setMemoriesOpen] = React.useState(false);

  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const workspaceQuery = useWorkspace(workspaceId);
  const { data: workspace } = workspaceQuery;

  // ── Workspace routes — no chrome, workspace manages its own layout ───────────
  if (workspaceId) {
    return (
      <WorkspaceContext.Provider value={workspaceQuery}>
        <WorkspacePanelProvider>
          <div className="bg-background flex h-svh w-full flex-col overflow-hidden">
            {children}
          </div>
        </WorkspacePanelProvider>
      </WorkspaceContext.Provider>
    );
  }

  // ── Dashboard route — topbar only, no sidebar ────────────────────────────────
  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <div className="bg-background flex h-svh w-full flex-col overflow-hidden">
        <DashboardTopbar onMemoriesOpen={() => setMemoriesOpen(true)} />
        <main id="main-content" className="no-scrollbar flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <MemoriesSheet open={memoriesOpen} onOpenChange={setMemoriesOpen} />

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
