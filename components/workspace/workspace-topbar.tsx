"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Loading02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { FluxLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { UserMenu } from "@/components/shell/user-menu";

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
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
      {/* 1. Left Zone: Breadcrumb + Editable Workspace Title */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Flux Logo + Wordmark */}
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
          title="Back to dashboard"
        >
          <FluxLogo className="text-primary size-5.5 shrink-0" />
          <span className="font-mono text-base font-normal tracking-tight text-foreground">
            Flux
          </span>
        </Link>

        <span
          aria-hidden
          className="text-muted-foreground/40 font-mono text-sm select-none"
        >
          /
        </span>

        {/* Editable Workspace Title */}
        <div className="flex min-w-0 items-center gap-1.5">
          <HugeiconsIcon
            icon={Folder01Icon}
            strokeWidth={1.5}
            className="size-4 shrink-0 text-muted-foreground"
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
              className="text-foreground ring-primary/40 focus:ring-primary/70 min-w-0 max-w-xs md:max-w-md rounded-md bg-transparent px-2 py-0.5 text-sm font-semibold tracking-tight ring-1 outline-none"
              maxLength={100}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="text-foreground hover:bg-muted/80 flex min-w-0 items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium tracking-tight transition-colors"
              title="Click to rename"
            >
              <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-md">
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

      {/* 2. Right Zone: Settings + Theme + Avatar */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Settings Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Workspace settings"
          className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Workspace settings"
        >
          <HugeiconsIcon
            icon={Settings01Icon}
            strokeWidth={1.5}
            className="size-4"
            aria-hidden
          />
        </Button>

        {/* Theme Switch */}
        <ThemeSwitch className="size-8" />

        {/* User Avatar Menu */}
        <UserMenu variant="avatar" onMemoriesOpen={onOpenMemories} />
      </div>
    </header>
  );
}
