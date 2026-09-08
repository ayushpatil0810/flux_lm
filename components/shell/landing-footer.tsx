"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";

import { FluxLogo } from "@/components/ui/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Split-edge pill footer matching LandingTopbar and DashboardTopbar:
 * - Left pill: Brand logo and copyright flush to the left screen boundary.
 * - Right pill: Minimal links + smooth "Go to top" button flush to the right screen boundary.
 */
export function LandingFooter() {
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <footer className="w-full py-10 pb-safe">
      <div className="flex w-full items-center justify-between gap-3">
        {/* ── Left Pill: Logo & Copyright stuck flush to left screen edge ── */}
        <div className="shrink-0">
          <div className="flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-5 shadow-xs backdrop-blur-md sm:h-12 sm:gap-3 sm:pl-5 sm:pr-6 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-85"
              aria-label="Flux home"
            >
              <FluxLogo className="text-primary size-4.5 shrink-0 sm:size-5" />
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
                Flux
              </span>
            </Link>
            <div
              aria-hidden="true"
              className="hidden h-3.5 w-px bg-border/60 dark:bg-border/40 sm:block"
            />
            <span className="hidden font-inter text-xs text-muted-foreground/70 sm:inline">
              © 2026 Flux
            </span>
          </div>
        </div>

        {/* ── Right Pill: Navigation & Go to Top stuck flush to right screen edge ── */}
        <div className="shrink-0">
          <div className="flex h-11 items-center gap-1 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <Link
              href="/dashboard"
              className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground sm:px-3 sm:text-sm"
            >
              Dashboard
            </Link>

            <div
              aria-hidden="true"
              className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground sm:size-8"
                  aria-label="Scroll to top"
                >
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    strokeWidth={1.8}
                    className="size-4"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Back to top
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Mobile-only copyright below pills */}
      <div className="mt-4 text-center sm:hidden">
        <span className="font-inter text-[11px] text-muted-foreground/60">
          © 2026 Flux. Understand Anything.
        </span>
      </div>
    </footer>
  );
}
