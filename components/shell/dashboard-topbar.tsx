"use client"

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTopbar } from '@/components/shell/topbar-context'

interface DashboardTopbarProps {
  onNewWorkspace?: () => void
}

/**
 * Top bar header for the global (non-workspace) routes: dashboard and
 * memories. Workspace routes render their own contextual header inside
 * the workspace view instead.
 */
export function DashboardTopbar({ onNewWorkspace }: DashboardTopbarProps) {
  const pathname = usePathname()
  const { config } = useTopbar()

  const isDashboard = pathname === '/dashboard' || pathname === '/'
  const isMemories = pathname.includes('/memories')

  let title = config.title
  let description = config.description
  let actions = config.actions

  if (!title) {
    if (isDashboard) {
      title = 'Your Workspaces'
      description = 'Select or configure an active knowledge workspace.'
      actions = onNewWorkspace ? (
        <Button onClick={onNewWorkspace} className="h-9 gap-1.5 px-3.5">
          <Plus className="size-4" />
          New Workspace
        </Button>
      ) : null
    } else if (isMemories) {
      title = 'Memories'
      description = 'Facts and preferences Flux remembers from your conversations, across all workspaces.'
    } else {
      title = 'Flux'
      description = 'Intelligent research assistant workspace.'
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border/30 px-4 md:h-14 md:px-6 bg-background">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-8 shrink-0 md:hidden [&_svg]:size-4.5!" />

        <div className="flex flex-col gap-0 min-w-0">
          <h1 className="font-sans text-sm font-medium tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description ? (
            <p className="text-xs text-muted-foreground/70 truncate hidden sm:block">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
