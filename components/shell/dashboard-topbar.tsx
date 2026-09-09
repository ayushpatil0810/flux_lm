"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { AppTopbar } from "@/components/shell/app-topbar";
import { useDashboardSearch } from "@/components/shell/dashboard-search-context";

interface DashboardTopbarProps {
  onMemoriesOpen: () => void;
}

/**
 * Split-edge pill navigation with center search bar for the dashboard,
 * built on the unified AppTopbar shell.
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

  const searchPill = (
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
  );

  return (
    <AppTopbar
      homeHref="/dashboard"
      homeAriaLabel="Flux dashboard"
      centerSlot={searchPill}
      showThemeSwitch={true}
      showUserMenu={true}
      onMemoriesOpen={onMemoriesOpen}
    />
  );
}
