"use client"
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon } from '@hugeicons/core-free-icons';

import * as React from 'react'
import Link from 'next/link'

import { FluxLogo } from '@/components/ui/logo'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/shell/user-menu'

interface DashboardTopbarProps {
  onMemoriesOpen: () => void
}

/**
 * Top bar for the dashboard. No sidebar — everything lives here:
 * logo, memories trigger, theme toggle, and account menu.
 */
export function DashboardTopbar({ onMemoriesOpen }: DashboardTopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/30 px-5 bg-background">
      {/* Left: logo + wordmark */}
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <FluxLogo className="size-6 shrink-0 text-primary" />
        <span className="text-base font-semibold tracking-tight truncate">Flux</span>
      </Link>

      {/* Right: icon actions + avatar */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={onMemoriesOpen}
          aria-label="Open memories"
          title="Memories"
        >
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="size-4.5" />
        </Button>

        <ThemeSwitch />

        <div className="ml-1">
          <UserMenu variant="avatar" />
        </div>
      </div>
    </header>
  )
}
