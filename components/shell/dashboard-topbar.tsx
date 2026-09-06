"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";
import { useDashboardSearch } from "@/components/shell/dashboard-search-context";

interface DashboardTopbarProps {
  onMemoriesOpen: () => void;
}

/**
 * Split-edge pill navigation with center search bar for the dashboard:
 * - Left pill: Logo stuck flush to the left screen boundary (flat left end, curved right end).
 * - Center pill: Fully integrated search bar with ⌘K / Ctrl+K shortcut and clear button.
 * - Right pill: Theme switch + User menu stuck flush to the right screen boundary (curved left end, flat right end).
 */
export function DashboardTopbar({ onMemoriesOpen }: DashboardTopbarProps) {
  const { searchQuery, setSearchQuery, searchInputRef } = useDashboardSearch();
  const [modifierKey, setModifierKey] = React.useState("⌘K");

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
    ) {
      setModifierKey("Ctrl+K");
    }
  }, []);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef, setSearchQuery]);

  return (
    <header className="pointer-events-none sticky top-0 z-40 flex w-full items-center justify-between gap-2 pt-3 pb-2 sm:gap-4 sm:pt-4">
      {/* ── Left Pill: Logo stuck to the left end, curved toward the center ── */}
      <div className="pointer-events-auto shrink-0">
        <Link
          href="/dashboard"
          className="group flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-4 shadow-xs backdrop-blur-md transition-all hover:border-border hover:bg-background/95 sm:h-12 sm:pl-5 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md dark:hover:bg-card/95"
          aria-label="Flux dashboard"
        >
          <FluxLogo className="text-primary size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-5" />
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
            Flux
          </span>
        </Link>
      </div>

      {/* ── Center Pill: Primary Search Bar ── */}
      <div className="pointer-events-auto flex flex-1 items-center justify-center px-1 sm:px-2">
        <div className="group relative flex h-10 w-full max-w-[200px] items-center rounded-full border border-border/80 bg-background/85 px-3 shadow-xs backdrop-blur-md transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 xs:max-w-[260px] sm:h-11 sm:max-w-sm md:max-w-md dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.8}
            className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="h-full w-full bg-transparent pl-2.5 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none sm:text-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 hidden select-none items-center rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              {modifierKey}
            </kbd>
          )}
        </div>
      </div>

      {/* ── Right Pill: Theme switch & Profile stuck to the right end, curved toward the center ── */}
      <div className="pointer-events-auto shrink-0">
        <div className="flex h-11 items-center gap-2 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          <ThemeSwitch className="size-7.5 rounded-full" />
          <div
            aria-hidden="true"
            className="h-3.5 w-px bg-border/60 dark:bg-border/40"
          />
          <UserMenu variant="avatar" onMemoriesOpen={onMemoriesOpen} />
        </div>
      </div>
    </header>
  );
}
