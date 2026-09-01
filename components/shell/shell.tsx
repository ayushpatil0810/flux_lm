"use client"

import * as React from 'react'
import { useParams } from 'next/navigation'

import { useWorkspace } from '@/hooks/use-workspaces'
import { CreateWorkspaceDialog } from '@/components/shell/create-workspace-dialog'
import { EditWorkspaceDialog } from '@/components/shell/edit-workspace-dialog'
import { DashboardTopbar } from '@/components/shell/dashboard-topbar'
import { WorkspacePanelProvider } from '@/components/shell/workspace-panel-context'
import { WorkspaceContext } from '@/components/shell/workspace-context'
import { MemoriesSheet } from '@/components/memories/memories-sheet'

interface ShellProps {
  children: React.ReactNode
}

/**
 * Authenticated application shell.
 *
 * - Workspace routes (/workspace/[id]): children only, no chrome.
 *   The workspace view manages its own topbar + panels.
 * - Dashboard route: slim topbar (no sidebar) + memories sheet overlay.
 */
export function Shell({ children }: ShellProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [memoriesOpen, setMemoriesOpen] = React.useState(false)

  const params = useParams()
  const workspaceId = params.workspaceId as string | undefined
  const workspaceQuery = useWorkspace(workspaceId)
  const { data: workspace } = workspaceQuery

  // ── Workspace routes — no chrome, workspace manages its own layout ───────────
  if (workspaceId) {
    return (
      <WorkspaceContext.Provider value={workspaceQuery}>
        <WorkspacePanelProvider>
          <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
            {children}
          </div>

          {workspace ? (
            <EditWorkspaceDialog
              workspace={workspace}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          ) : null}
        </WorkspacePanelProvider>
      </WorkspaceContext.Provider>
    )
  }

  // ── Dashboard route — topbar only, no sidebar ────────────────────────────────
  return (
    <WorkspaceContext.Provider value={workspaceQuery}>
      <WorkspacePanelProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
          <DashboardTopbar onMemoriesOpen={() => setMemoriesOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto no-scrollbar">
            {children}
          </main>
        </div>

        <MemoriesSheet open={memoriesOpen} onOpenChange={setMemoriesOpen} />

        <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
        {workspace ? (
          <EditWorkspaceDialog
            workspace={workspace}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        ) : null}
      </WorkspacePanelProvider>
    </WorkspaceContext.Provider>
  )
}