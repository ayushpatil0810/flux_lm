"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon as Check,
  ArrowUpDownIcon as ChevronsUpDown,
} from "@hugeicons/core-free-icons";

import type { Workspace } from "@/lib/api";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceSwitcherProps {
  workspace: Workspace;
  className?: string;
}

/**
 * Workspace switcher. Only switching lives in this menu: creation is a
 * section action in the rail and settings sit beside the switcher, so
 * the menu has a single, obvious purpose.
 */
export function WorkspaceSwitcher({
  workspace,
  className,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Current workspace: ${workspace.title}. Open workspace switcher.`}
        className={cn(
          "hover:bg-muted/80 focus-visible:ring-ring/60 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer",
          className,
        )}
      >
        <HugeiconsIcon
          icon={ChevronsUpDown}
          className="size-3.5 shrink-0"
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
              <HugeiconsIcon
                icon={Check}
                className="text-primary size-4 shrink-0"
                aria-hidden
              />
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
