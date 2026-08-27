"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon as Check, ArrowUpDownIcon as ChevronsUpDown } from "@hugeicons/core-free-icons";

import type { Workspace } from "@/lib/api";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Workspace switcher. Only switching lives in this menu: creation is a
 * section action in the rail and settings sit beside the switcher, so
 * the menu has a single, obvious purpose.
 */
export function WorkspaceSwitcher({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Current workspace: ${workspace.title}. Open workspace switcher.`}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-secondary text-xs font-medium text-secondary-foreground"
          >
            {workspace.title.trim().slice(0, 1).toUpperCase() || "W"}
          </span>
          <span className="truncate text-sm font-medium">
            {workspace.title}
          </span>
        </span>
        <HugeiconsIcon icon={ChevronsUpDown}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        {workspaces?.map((entry) => (
          <DropdownMenuItem
            key={entry.id}
            onSelect={() => router.push(`/workspace/${entry.id}`)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{entry.title}</span>
            {entry.id === workspace.id ? (
              <HugeiconsIcon icon={Check} className="size-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
          All workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
