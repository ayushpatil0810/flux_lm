"use client"

import * as React from 'react'
import { useParams } from 'next/navigation'

import { useWorkspace } from '@/hooks/use-workspaces'
import { CreateWorkspaceDialog } from '@/components/shell/create-workspace-dialog'
import { EditWorkspaceDialog } from '@/components/shell/edit-workspace-dialog'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { DashboardTopbar } from '@/components/shell/dashboard-topbar'
import { TopbarProvider } from '@/components/shell/topbar-context'
import { WorkspacePanelProvider } from '@/components/shell/workspace-panel-context'

import { WorkspaceContext } from '@/components/shell/workspace-context'

interface ShellProps {
  children: React.ReactNode
}

/**
 * Authenticated application shell adopting the reference dashboard layout.
 */
export function Shell({ children }: ShellProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)

  const params = useParams()
  const workspaceId = params.workspaceId as string | undefined
  const workspaceQuery = useWorkspace(workspaceId)
  const { data: workspace } = workspaceQuery

  return (
    <WorkspaceContext.Provider value={workspaceQuery}>
      <TopbarProvider>
        <WorkspacePanelProvider key={workspaceId ?? "dashboard"}>
        <SidebarProvider
          defaultOpen
          className="h-svh w-full overflow-hidden no-scrollbar"
          style={
            {
              '--sidebar-width': '18.125rem',
              '--sidebar-width-icon': '4.25rem',
            } as React.CSSProperties
          }
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>

          <AppSidebar
            workspace={workspace}
            onNewWorkspace={() => setCreateOpen(true)}
            onWorkspaceSettings={() => setEditOpen(true)}
          />

          <main className="flex flex-1 flex-col overflow-hidden bg-background">
            {workspaceId ? null : (
              <DashboardTopbar onNewWorkspace={() => setCreateOpen(true)} />
            )}
            <div id="main-content" className="flex-1 overflow-y-auto no-scrollbar">
              {children}
            </div>
          </main>

          <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
          {workspace ? (
            <EditWorkspaceDialog
              workspace={workspace}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          ) : null}
        </SidebarProvider>
      </WorkspacePanelProvider>
    </TopbarProvider>
    </WorkspaceContext.Provider>
  )
}