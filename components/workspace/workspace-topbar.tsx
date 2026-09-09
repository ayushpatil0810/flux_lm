"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Loading02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { AppTopbar } from "@/components/shell/app-topbar";
import { Button } from "@/components/ui/button";
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

  const centerPill = (
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
            title="Rename workspace"
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
  );

  const settingsButton = (
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
  );

  return (
    <AppTopbar
      homeHref="/dashboard"
      homeAriaLabel="Flux dashboard"
      backHref="/dashboard"
      backAriaLabel="Back to dashboard"
      backTooltip={
        <span>
          Back to workspaces (<kbd className="font-mono text-[10px]">Esc</kbd>)
        </span>
      }
      centerSlot={centerPill}
      rightActions={settingsButton}
      showThemeSwitch={true}
      showUserMenu={true}
      onMemoriesOpen={onOpenMemories}
    />
  );
}


