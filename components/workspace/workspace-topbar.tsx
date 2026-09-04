"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Loading02Icon,
  Settings01Icon,
  ArrowLeft02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";

import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";
import { FluxLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";
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

  const {
    setLeftOpen,
    setImportDialogOpen,
  } = useWorkspacePanel();

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
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between bg-background px-2.5 sm:px-4 transition-all">
      {/* 1. Left Zone: Nav + Left Rail Toggle + Editable Title + Status */}
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
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

        <div className="hidden sm:flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-foreground hover:opacity-85 transition-opacity"
          >
            <FluxLogo className="text-primary size-5 shrink-0" />
            <span className="font-mono text-sm font-semibold tracking-tight">
              Flux
            </span>
          </Link>
          <span
            aria-hidden
            className="text-muted-foreground/40 font-mono text-xs select-none"
          >
            /
          </span>
        </div>

        {/* Editable Workspace Title */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <HugeiconsIcon
            icon={Folder01Icon}
            strokeWidth={1.5}
            className="size-4 shrink-0 text-muted-foreground hidden xs:block"
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
              className="text-foreground ring-primary/40 focus:ring-primary/70 min-w-0 max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md rounded-md bg-transparent px-1.5 sm:px-2 py-0.5 text-xs sm:text-sm font-semibold tracking-tight ring-1 outline-none"
              maxLength={100}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="text-foreground hover:bg-muted/80 flex min-w-0 items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-xs sm:text-sm font-medium tracking-tight transition-colors active:scale-[0.99]"
              title="Click to rename"
            >
              <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-xs md:max-w-md">
                {workspace?.title ?? "Workspace"}
              </span>
            </button>
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

      {/* 2. Right Zone: Actions + Right Rail Toggle + User */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">

        {/* Quick Add Source button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setImportDialogOpen(true);
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              setLeftOpen(true);
            }
          }}
          className="h-8 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs font-medium hover:border-primary/40 active:scale-95 shadow-none"
          title="Add source to workspace"
        >
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            className="size-3.5 text-primary"
          />
          <span className="hidden sm:inline">Add Source</span>
        </Button>



        <div className="h-4 w-px bg-border/60 mx-0.5" />

        {/* Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              aria-label="Workspace settings"
              className="size-8 text-muted-foreground hover:text-foreground rounded-lg active:scale-95"
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

        {/* Theme Switch */}
        <ThemeSwitch className="size-8" />

        {/* User Avatar Menu */}
        <UserMenu variant="avatar" onMemoriesOpen={onOpenMemories} />
      </div>
    </header>
  );
}


