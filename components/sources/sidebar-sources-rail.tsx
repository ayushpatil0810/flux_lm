"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  SidebarLeftIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import * as React from "react";

import { useSources } from "@/hooks/use-sources";
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarSourcesRailProps {
  workspaceId: string;
  onExpand: () => void;
}

/**
 * Thinner collapsed rail for the Sources sidebar.
 * Displays a single quick-import action to open the unified import dialogue box.
 */
export function SidebarSourcesRail({
  workspaceId,
  onExpand,
}: SidebarSourcesRailProps) {
  const { data: sources } = useSources(workspaceId);
  const { setImportDialogOpen } = useWorkspacePanel();

  const sourceCount = sources?.length ?? 0;

  return (
    <aside
      className="flex w-13 shrink-0 flex-col items-center rounded-xl border border-border/70 bg-card py-2.5 shadow-xs select-none"
      aria-label="Sources Quick Actions Rail"
    >
      {/* Top: Expand Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand Sources (⌘B)"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon
              icon={SidebarLeftIcon}
              strokeWidth={1.5}
              className="size-5"
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Expand Sources (<kbd className="font-mono text-[10px]">⌘B</kbd>)
        </TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="my-2 h-px w-6 shrink-0 bg-border/50" />

      {/* Single Unified Add Source Action */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setImportDialogOpen(true)}
            aria-label="Add Source"
            className="flex size-9 items-center justify-center rounded-lg border border-dashed border-border/80 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden cursor-pointer"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-4.5"
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Add Source
        </TooltipContent>
      </Tooltip>

      {/* Bottom: Source Count & Quick Browse */}
      {sourceCount > 0 && (
        <div className="mt-auto flex shrink-0 flex-col items-center pt-2">
          <div className="mb-2 h-px w-6 shrink-0 bg-border/50" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onExpand}
                aria-label={`Browse ${sourceCount} sources`}
                className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={File01Icon}
                  strokeWidth={1.5}
                  className="size-5"
                />
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 font-mono text-[10px] font-bold text-primary ring-1.5 ring-card">
                  {sourceCount}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Browse {sourceCount} source{sourceCount === 1 ? "" : "s"} (
              <kbd className="font-mono text-[10px]">⌘B</kbd>)
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
