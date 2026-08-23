"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOutIcon,
} from 'lucide-react'
import { BookOpen, Sparkles } from 'lucide-react'
import {
  SidebarCollapseIcon,
  ToggleIcon,
  UserIcon,
  HomeIcon,
  ClockIcon,
} from '@/components/ui/icons'
import { FluxLogo } from '@/components/ui/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn, getInitials } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { useToast } from '@/components/providers/toast-provider'
import type { Workspace } from '@/lib/api'
import { WorkspaceSwitcher } from '@/components/shell/workspace-switcher'
import { useWorkspacePanel } from '@/components/shell/workspace-panel-context'

const menuButtonClassName = cn(
  'h-11 gap-2.5 rounded-lg px-3 text-base text-sidebar-foreground/70 transition-colors',
  'aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground',
  'data-open:bg-background data-open:text-sidebar-accent-foreground',
  '[&_svg]:size-5!',
  'group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden',
)

export type NavigationItem = {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
}

function NavItem({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const isActive =
    item.href === '/' || item.href === '/dashboard'
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <SidebarMenuButton
      asChild
      tooltip={item.name}
      className={menuButtonClassName}
    >
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          onNavigate?.()
          if (isMobile) setOpenMobile(false)
        }}
      >
        <item.icon />
        <span>{item.name}</span>
        {item.badge ? (
          <SidebarMenuBadge className="sidebar-badge-shadow static ml-auto rounded bg-background px-2 py-1.5 text-sm font-normal text-sidebar-foreground/70 group-aria-[current=page]/menu-button:font-medium group-aria-[current=page]/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
            {item.badge}
          </SidebarMenuBadge>
        ) : null}
      </Link>
    </SidebarMenuButton>
  )
}

/** A panel-toggle item: looks like a nav item but drives the workspace panel context. */
function PanelNavItem({
  panel,
  label,
  icon: Icon,
  tooltip,
}: {
  panel: 'sources' | 'artifacts'
  label: string
  icon: React.ElementType
  tooltip: string
}) {
  const { activePanel, toggle } = useWorkspacePanel()
  const isActive = activePanel === panel

  return (
    <SidebarMenuButton
      tooltip={tooltip}
      className={cn(
        menuButtonClassName,
        isActive && 'bg-background font-medium text-sidebar-accent-foreground',
      )}
      onClick={() => toggle(panel)}
      aria-pressed={isActive}
    >
      <Icon />
      <span>{label}</span>
    </SidebarMenuButton>
  )
}

// Removed DarkModeItem in favor of ThemeToggle

function ProfileItem() {
  const { data: session } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const { push } = useToast()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      window.location.href = '/login'
    } catch {
      setIsSigningOut(false)
      push({
        variant: 'destructive',
        title: 'Could not sign out',
        description: 'Check your connection and try again.',
      })
    }
  }

  const user = session?.user

  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Profile" className={menuButtonClassName}>
            <UserIcon />
            <span>Profile</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="leading-tight">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'Account'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            {isSigningOut ? 'Signing out...' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function CollapseControl({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  if (!collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex size-9.5 shrink-0 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="Collapse sidebar"
      >
        <SidebarCollapseIcon className="-rotate-90" />
      </button>
    )
  }

  return (
    <div className="relative size-10 shrink-0 group flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-all ease-linear group-hover:scale-75 group-hover:opacity-0">
        <FluxLogo className="size-6 text-primary" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all ease-linear group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-10 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Expand sidebar"
        >
          <SidebarCollapseIcon className="rotate-90" />
        </button>
      </div>
    </div>
  )
}

export interface AppSidebarProps {
  workspace?: Workspace
  onNavigate?: () => void
  onNewWorkspace?: () => void
  onWorkspaceSettings?: () => void
}

export function AppSidebar({ workspace, onNavigate, onNewWorkspace, onWorkspaceSettings }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  const generalNavItems: NavigationItem[] = [
    { name: 'Workspaces', href: '/dashboard', icon: HomeIcon },
    { name: 'Memories', href: '/dashboard/memories', icon: ClockIcon },
  ]

  return (
    <Sidebar collapsible="icon" className="h-full border-r border-sidebar-border bg-sidebar">
      <SidebarHeader
        className={cn(
          'h-12 flex-row items-center border-b border-sidebar-border transition-[padding] md:h-14',
          collapsed ? 'justify-center px-0' : 'justify-between gap-4.75 px-4',
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
            <FluxLogo className="size-8 shrink-0 text-primary" />
            <span className="truncate text-xl font-semibold tracking-tight">Flux</span>
          </Link>
        )}
        <CollapseControl collapsed={collapsed} onToggle={toggleSidebar} />
      </SidebarHeader>

      <SidebarContent className="gap-4 overflow-x-hidden overflow-y-auto px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:overflow-y-auto!">
        {workspace && (
          <SidebarGroup className="gap-2 p-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
            <SidebarGroupLabel className="h-auto px-3 py-1 text-base font-normal text-muted-foreground group-data-[collapsible=icon]:hidden">
              Workspace
            </SidebarGroupLabel>

            {!collapsed && (
              <div className="mb-2 mt-1 px-3">
                <WorkspaceSwitcher workspace={workspace} />
              </div>
            )}

            <SidebarGroupContent className="w-full text-sm group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                {/* Sources panel toggle */}
                <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                  <PanelNavItem
                    panel="sources"
                    label="Sources"
                    icon={BookOpen}
                    tooltip="Sources"
                  />
                </SidebarMenuItem>

                {/* Artifacts panel toggle */}
                <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                  <PanelNavItem
                    panel="artifacts"
                    label="Artifacts"
                    icon={Sparkles}
                    tooltip="Artifacts"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="gap-2 p-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
          <SidebarGroupLabel className="h-auto px-3 py-1 text-base font-normal text-muted-foreground group-data-[collapsible=icon]:hidden">
            {workspace ? 'General' : 'Navigate'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="w-full text-sm group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
              {generalNavItems.map((item) => (
                <SidebarMenuItem key={item.name} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                  <NavItem item={item} onNavigate={onNavigate} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full mb-1 flex justify-center">
            <ThemeToggle />
          </SidebarMenuItem>
          <ProfileItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
