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

import { ThemeSwitch } from "@/components/ui/theme-switch";

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
    <header className="border-border/30 bg-background/80 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl relative z-40">
      {/* 1. Left Zone: Logo & Sources */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="focus-visible:ring-primary/60 flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:outline-none transition-transform hover:scale-105"
          aria-label="Back to dashboard"
        >
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg ring-4 ring-primary/5">
            <FluxLogo className="size-4" />
          </div>
        </Link>
        <span aria-hidden className="bg-border/50 h-5 w-px mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLeftOpen(!leftOpen)}
          aria-label={leftOpen ? "Close sources panel" : "Open sources panel"}
          className={cn(
            "text-muted-foreground gap-1.5 font-medium transition-colors hover:bg-accent/60",
            leftOpen && "bg-accent/60 text-foreground shadow-sm",
          )}
        >
          <HugeiconsIcon
            icon={SidebarLeftIcon}
            strokeWidth={1.5}
            className="size-4.5"
            aria-hidden
          />
          <span className="hidden sm:inline">Sources</span>
        </Button>
      </div>

      {/* 2. Center Zone: Workspace Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 max-w-[40%]">
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
            className="text-foreground ring-primary/40 focus:ring-primary/70 min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-semibold tracking-tight ring-1 outline-none text-center"
            maxLength={100}
            autoFocus
          />
        ) : (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={startEditing}
              className="text-foreground truncate rounded-md px-2 py-0.5 text-[15px] font-semibold tracking-tight transition-colors hover:bg-white/5"
              title="Click to rename"
            >
              {workspace?.title ?? "Workspace"}
            </button>
          </div>
        )}

        {updateWorkspace.isPending && (
          <HugeiconsIcon
            icon={Loading02Icon}
            strokeWidth={1.5}
            className="text-muted-foreground size-3.5 shrink-0 animate-spin absolute -right-6 top-1/2 -translate-y-1/2"
            aria-hidden
          />
        )}
      </div>

      {/* 3. Right Zone: Theme, Settings, Artifacts */}
      <div className="flex items-center gap-2">
        <ThemeSwitch className="size-8" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Workspace settings"
          className="text-muted-foreground transition-colors hover:bg-accent/60 size-8"
        >
          <HugeiconsIcon
            icon={Settings01Icon}
            strokeWidth={1.5}
            className="size-4.5"
            aria-hidden
          />
        </Button>
        <span aria-hidden className="bg-border/50 h-5 w-px mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRightOpen(!rightOpen)}
          aria-label={
            rightOpen ? "Close artifacts panel" : "Open artifacts panel"
          }
          className={cn(
            "text-muted-foreground gap-1.5 font-medium transition-colors hover:bg-accent/60",
            rightOpen && "bg-accent/60 text-foreground shadow-sm",
          )}
        >
          <span className="hidden sm:inline">Artifacts</span>
          <HugeiconsIcon
            icon={SidebarRightIcon}
            strokeWidth={1.5}
            className="size-4.5"
            aria-hidden
          />
        </Button>
      </div>
    </header>
  );
}
