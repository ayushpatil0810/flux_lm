"use client";

import * as React from "react";
import Link from "next/link";

import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";

interface DashboardTopbarProps {
  onMemoriesOpen: () => void;
}

/**
 * Top bar for the dashboard. No sidebar — everything lives here:
 * logo, theme toggle, and account menu.
 */
export function DashboardTopbar({ onMemoriesOpen }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        {/* Left: logo + wordmark */}
        <Link
          href="/dashboard"
          className="group flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <FluxLogo className="text-primary size-6 shrink-0" />
          <span className="truncate text-base font-mono font-normal tracking-tight text-foreground">
            Flux
          </span>
        </Link>

        {/* Right: theme toggle + avatar */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitch />
          <UserMenu variant="avatar" onMemoriesOpen={onMemoriesOpen} />
        </div>
      </div>
    </header>
  );
}
