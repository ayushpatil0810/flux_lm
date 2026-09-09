"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AppTopbarProps {
  /** Destination for the logo/brand link (default: "/dashboard") */
  homeHref?: string;
  /** Optional accessible label for the logo link */
  homeAriaLabel?: string;
  /** Optional back button destination */
  backHref?: string;
  /** Label/content for the back button tooltip */
  backTooltip?: React.ReactNode;
  /** Optional accessible label for the back button */
  backAriaLabel?: string;
  /** Center pill slot (e.g. search bar or workspace title/switcher) */
  centerSlot?: React.ReactNode;
  /** Actions rendered in the right pill to the left of ThemeSwitch */
  rightActions?: React.ReactNode;
  /** Actions/content rendered to the right of ThemeSwitch */
  rightEnd?: React.ReactNode;
  /** Whether to show the ThemeSwitch (default: true) */
  showThemeSwitch?: boolean;
  /** Whether to show the UserMenu (default: false) */
  showUserMenu?: boolean;
  /** Optional callback for Memories sheet in UserMenu */
  onMemoriesOpen?: () => void;
  className?: string;
}

export function AppTopbar({
  homeHref = "/dashboard",
  homeAriaLabel = "Flux",
  backHref,
  backTooltip,
  backAriaLabel = "Back",
  centerSlot,
  rightActions,
  rightEnd,
  showThemeSwitch = true,
  showUserMenu = false,
  onMemoriesOpen,
  className,
}: AppTopbarProps) {
  return (
    <header
      className={cn(
        "pointer-events-none sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 pt-3 pb-2 sm:gap-4 sm:pt-4",
        className
      )}
    >
      {/* ── Left Pill: Stuck flush to left boundary ── */}
      <div className="pointer-events-auto shrink-0">
        {backHref ? (
          <div className="flex h-11 items-center gap-1.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-2.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-3 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={backHref}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                  aria-label={backAriaLabel}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    strokeWidth={1.5}
                    className="size-4"
                  />
                </Link>
              </TooltipTrigger>
              {backTooltip && (
                <TooltipContent side="bottom" sideOffset={6}>
                  {backTooltip}
                </TooltipContent>
              )}
            </Tooltip>

            <Link
              href={homeHref}
              className="group flex items-center gap-2 pl-0.5 text-foreground transition-opacity hover:opacity-85"
              aria-label={homeAriaLabel}
            >
              <FluxLogo className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-6.5" />
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
                Flux
              </span>
            </Link>
          </div>
        ) : (
          <Link
            href={homeHref}
            className="group flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-4 shadow-xs backdrop-blur-md transition-all hover:border-border hover:bg-background/95 sm:h-12 sm:pl-5 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md dark:hover:bg-card/95"
            aria-label={homeAriaLabel}
          >
            <FluxLogo className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-6.5" />
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Flux
            </span>
          </Link>
        )}
      </div>

      {/* ── Center Pill: Floating rounded pill slot (optional) ── */}
      <div className="pointer-events-auto flex flex-1 items-center justify-center px-1 sm:px-2">
        {centerSlot}
      </div>

      {/* ── Right Pill: Stuck flush to right boundary ── */}
      <div className="pointer-events-auto shrink-0">
        <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          {rightActions}

          {rightActions && (showThemeSwitch || rightEnd || showUserMenu) && (
            <div
              aria-hidden="true"
              className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
            />
          )}

          {showThemeSwitch && (
            <ThemeSwitch className="size-7.5 shrink-0 rounded-full" />
          )}

          {showThemeSwitch && (rightEnd || showUserMenu) && (
            <div
              aria-hidden="true"
              className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
            />
          )}

          {rightEnd}

          {showUserMenu && !rightEnd && (
            <UserMenu variant="avatar" onMemoriesOpen={onMemoriesOpen} />
          )}
        </div>
      </div>
    </header>
  );
}
