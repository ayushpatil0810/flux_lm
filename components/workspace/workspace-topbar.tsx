"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Loading02Icon,
  Settings01Icon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";

import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { FluxLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkspaceTopbarProps {
  workspaceId: string;
  onOpenSettings: () => void;
  onOpenMemories?: () => void;
}

export function WorkspaceTopbar({
  workspaceId,
  onOpenSettings,
  onOpenMemories,
}: WorkspaceTopbarProps) {
  const workspaceCtx = useWorkspaceContext();
  const workspace = workspaceCtx.data;
  const updateWorkspace = useUpdateWorkspace();

  const [editing, setEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraftTitle(workspace?.title ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitEdit() {
    if (!editing || !workspace) return;
    setEditing(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== workspace.title) {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        input: { title: trimmed },
      });
    }
  }

  function cancelEdit() {
    setEditing(false);
    setDraftTitle("");
  }

  return (
    <header className="pointer-events-none sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 pt-2.5 pb-2 transition-all sm:pt-3">
      {/* ── Left Pill: Back to Dashboard & Flux Brand (stuck to left edge, curved toward center) ── */}
      <div className="pointer-events-auto shrink-0">
        <div className="flex h-11 items-center gap-1.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-2.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-3 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                aria-label="Back to dashboard"
              >
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  strokeWidth={1.5}
                  className="size-4"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Back to workspaces (<kbd className="font-mono text-[10px]">Esc</kbd>)
            </TooltipContent>
          </Tooltip>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 pl-0.5 text-foreground transition-opacity hover:opacity-85"
          >
            <FluxLogo className="text-primary size-4.5 shrink-0 sm:size-5" />
            <span className="font-mono text-sm font-semibold tracking-tight">
              Flux
            </span>
          </Link>
        </div>
      </div>

      {/* ── Center Pill: Workspace Title & Switcher (floating rounded pill) ── */}
      <div className="pointer-events-auto flex flex-1 items-center justify-center px-1 sm:px-2">
        <div className="flex h-10 max-w-[200px] items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-3 py-1 shadow-xs backdrop-blur-md transition-all xs:max-w-[260px] sm:h-11 sm:max-w-sm sm:gap-2 sm:px-3.5 md:max-w-md dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          <HugeiconsIcon
            icon={Folder01Icon}
            strokeWidth={1.5}
            className="text-muted-foreground hidden size-4 shrink-0 xs:block"
          />

          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") inputRef.current?.blur();
                if (e.key === "Escape") cancelEdit();
              }}
              className="text-foreground ring-primary/40 focus:ring-primary/70 min-w-0 max-w-[120px] rounded-md bg-transparent px-1.5 py-0.5 text-xs font-semibold tracking-tight ring-1 outline-none xs:max-w-[170px] sm:max-w-xs sm:text-sm"
              maxLength={100}
              autoFocus
            />
          ) : (
            <div className="flex min-w-0 items-center gap-0.5">
              <button
                type="button"
                onClick={startEditing}
                className="text-foreground hover:bg-muted/80 flex min-w-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tracking-tight transition-colors sm:text-sm"
                title="Click to rename"
              >
                <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[280px]">
                  {workspace?.title ?? "Workspace"}
                </span>
              </button>
              {workspace ? <WorkspaceSwitcher workspace={workspace} /> : null}
            </div>
          )}

          {updateWorkspace.isPending && (
            <HugeiconsIcon
              icon={Loading02Icon}
              strokeWidth={1.5}
              className="text-muted-foreground size-3.5 shrink-0 animate-spin"
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* ── Right Pill: Settings, Theme & User (stuck to right edge, curved toward center) ── */}
      <div className="pointer-events-auto shrink-0">
        <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-3 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-4 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
          {/* Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                aria-label="Workspace settings"
                className="size-8 cursor-pointer rounded-full text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={Settings01Icon}
                  strokeWidth={1.5}
                  className="size-4"
                  aria-hidden
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Workspace settings
            </TooltipContent>
          </Tooltip>

          <div
            aria-hidden="true"
            className="h-3.5 w-px bg-border/60 dark:bg-border/40"
          />

          {/* Theme Switch */}
          <ThemeSwitch className="size-7.5 rounded-full" />

          <div
            aria-hidden="true"
            className="h-3.5 w-px bg-border/60 dark:bg-border/40"
          />

          {/* User Avatar Menu */}
          <UserMenu variant="avatar" onMemoriesOpen={onOpenMemories} />
        </div>
      </div>
    </header>
  );
}


