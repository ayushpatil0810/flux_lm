"use client";

import * as React from "react";
import Link from "next/link";

import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/shell/user-menu";
import { authClient } from "@/lib/auth-client";

/**
 * Split-edge pill navigation for the landing page, matching DashboardTopbar and WorkspaceTopbar:
 * - Left pill: Logo stuck flush to the left screen boundary (flat left end, curved right end).
 * - Center pill: Floating pill with quick navigation links.
 * - Right pill: Theme switch + Auth actions / User menu stuck flush to the right screen boundary (curved left end, flat right end).
 */
interface LandingTopbarProps {
  isLoggedIn?: boolean;
}

export function LandingTopbar({ isLoggedIn: initialIsLoggedIn }: LandingTopbarProps = {}) {
  const { data: session } = authClient.useSession();
  const authenticated = session?.user
    ? true
    : session === null
      ? false
      : !!initialIsLoggedIn;

  return (
    <header className="pointer-events-none sticky top-0 z-40 flex w-full items-center justify-between gap-2 pt-3 pb-2 sm:gap-4 sm:pt-4">
      {/* ── Left Pill: Logo stuck to the left end, curved toward the center ── */}
      <div className="pointer-events-auto shrink-0">
        <Link
          href="/"
          className="group flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-4 shadow-xs backdrop-blur-md transition-all hover:border-border hover:bg-background/95 sm:h-12 sm:pl-5 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md dark:hover:bg-card/95"
          aria-label="Flux home"
        >
          <FluxLogo className="text-primary size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
            Flux
          </span>
        </Link>
      </div>

      {/* ── Right Pill: Theme switch & Profile / Auth stuck to the right end ── */}
      <div className="pointer-events-auto shrink-0">
        <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          <ThemeSwitch className="size-7.5 shrink-0 rounded-full" />
          <div
            aria-hidden="true"
            className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
          />
          {authenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                size="sm"
                className="h-7.5 rounded-full px-2.5 text-xs font-medium shadow-xs sm:h-8 sm:px-3.5"
              >
                <Link href="/dashboard">Open App</Link>
              </Button>
              <div
                aria-hidden="true"
                className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
              />
              <UserMenu variant="avatar" />
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7.5 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground sm:h-8 sm:px-3"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-7.5 rounded-full px-2.5 text-xs font-medium shadow-xs sm:h-8 sm:px-3.5"
              >
                <Link href="/dashboard">Try Flux</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
