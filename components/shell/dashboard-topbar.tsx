"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";

import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/shell/user-menu";

interface DashboardTopbarProps {
  onMemoriesOpen: () => void;
}

/**
 * Top bar for the dashboard. No sidebar — everything lives here:
 * logo, memories trigger, theme toggle, and account menu.
 */
export function DashboardTopbar({ onMemoriesOpen }: DashboardTopbarProps) {
  return (
    <header className="border-border/30 bg-background flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5">
      {/* Left: logo + wordmark */}
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <FluxLogo className="text-primary size-6 shrink-0" />
        <span className="truncate text-base font-semibold tracking-tight">
          Flux
        </span>
      </Link>

      {/* Right: icon actions + avatar */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onMemoriesOpen}
          aria-label="Open memories"
          title="Memories"
        >
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={1.5}
            className="size-4.5"
          />
          <span className="hidden sm:inline text-xs font-medium">Memories</span>
        </Button>

        <ThemeSwitch />

        <div className="ml-1">
          <UserMenu variant="avatar" />
        </div>
      </div>
    </header>
  );
}
