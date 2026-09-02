"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading02Icon,
  Settings01Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";

import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";
import { FluxLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useSources } from "@/hooks/use-sources";
import { useArtifacts } from "@/hooks/use-artifacts";

interface WorkspaceTopbarProps {
  workspaceId: string;
  onOpenSettings: () => void;
}

export function WorkspaceTopbar({
  workspaceId,
  onOpenSettings,
}: WorkspaceTopbarProps) {
  const { data: sources } = useSources(workspaceId);
  const { data: artifacts } = useArtifacts(workspaceId);

  const sourcesCount = sources?.length ?? 0;
  const artifactsCount = artifacts?.length ?? 0;
  const { leftOpen, setLeftOpen, rightOpen, setRightOpen } =
    useWorkspacePanel();
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

  const countLabel = [
    sourcesCount > 0 &&
      `${sourcesCount} source${sourcesCount === 1 ? "" : "s"}`,
    artifactsCount > 0 &&
      `${artifactsCount} artifact${artifactsCount === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="border-border/30 bg-background flex h-12 shrink-0 items-center gap-2 border-b px-3">
      {/* Left panel toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setLeftOpen(!leftOpen)}
        aria-label={leftOpen ? "Close sources panel" : "Open sources panel"}
        className={cn(
          "text-muted-foreground gap-1.5",
          leftOpen && "bg-muted text-foreground",
        )}
      >
        <HugeiconsIcon
          icon={SidebarLeftIcon}
          strokeWidth={1.5}
          className="size-4"
          aria-hidden
        />
        <span className="hidden sm:inline">Sources</span>
      </Button>

      {/* Logo — links to dashboard */}
      <Link
        href="/dashboard"
        className="focus-visible:ring-primary/60 flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Back to dashboard"
      >
        <FluxLogo className="text-primary size-5" />
      </Link>

      {/* Divider */}
      <span aria-hidden className="bg-border/50 h-4 w-px" />

      {/* Workspace title — click to edit inline */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
            className="text-foreground ring-primary/40 focus:ring-primary/70 min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-0.5 text-sm font-medium ring-1 outline-none"
            maxLength={100}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="text-foreground max-w-xs truncate rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors hover:bg-white/5"
            title="Click to rename"
          >
            {workspace?.title ?? "Workspace"}
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

        {!editing && countLabel ? (
          <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
            {countLabel}
          </span>
        ) : null}
      </div>

      {/* Settings */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenSettings}
        aria-label="Workspace settings"
        className="text-muted-foreground gap-1.5"
      >
        <HugeiconsIcon
          icon={Settings01Icon}
          strokeWidth={1.5}
          className="size-4"
          aria-hidden
        />
        <span className="hidden sm:inline">Settings</span>
      </Button>

      {/* Right panel toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setRightOpen(!rightOpen)}
        aria-label={
          rightOpen ? "Close artifacts panel" : "Open artifacts panel"
        }
        className={cn(
          "text-muted-foreground gap-1.5",
          rightOpen && "bg-muted text-foreground",
        )}
      >
        <span className="hidden sm:inline">Artifacts</span>
        <HugeiconsIcon
          icon={SidebarRightIcon}
          strokeWidth={1.5}
          className="size-4"
          aria-hidden
        />
      </Button>
    </header>
  );
}
