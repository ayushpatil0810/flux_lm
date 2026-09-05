"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MoreHorizontalIcon,
  File01Icon,
  CheckmarkBadge01Icon,
  Cards01Icon,
  Quiz02Icon,
  NetworkIcon,
  ShieldCheckIcon,
  SidebarRightIcon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { ArtifactType, LearningArtifact } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useArtifacts, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { useWorkspacePreview } from "@/components/shell/workspace-panel-context";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { ArtifactConfigDialog } from "./artifact-config-dialog";
import { getErrorMessage } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPE_DESCRIPTIONS,
  ARTIFACT_TYPE_ORDER,
  ARTIFACT_TYPE_STYLES,
  cleanArtifactTitle,
} from "./artifact-meta";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Type-to-icon mapping ────────────────────────────────────────────────────

export const ARTIFACT_TYPE_ICONS: Record<
  ArtifactType,
  React.FC<{ className?: string }>
> = {
  SUMMARY: (props) => (
    <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} {...props} />
  ),
  TAKEAWAYS: (props) => (
    <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={1.5} {...props} />
  ),
  FLASHCARDS: (props) => (
    <HugeiconsIcon icon={Cards01Icon} strokeWidth={1.5} {...props} />
  ),
  QUIZ: (props) => (
    <HugeiconsIcon icon={Quiz02Icon} strokeWidth={1.5} {...props} />
  ),
  MINDMAP: (props) => (
    <HugeiconsIcon icon={NetworkIcon} strokeWidth={1.5} {...props} />
  ),
  REPORT: (props) => (
    <HugeiconsIcon icon={ShieldCheckIcon} strokeWidth={1.5} {...props} />
  ),
};

// ── Panel ───────────────────────────────────────────────────────────────────

interface SidebarArtifactsProps {
  workspaceId: string;
  onClose: () => void;
  onPreviewArtifact: (id: string) => void;
}

/**
 * Artifacts panel:
 * - Per-type generation cards (click → focused config dialog)
 * - Generated artifacts list below
 */
export function SidebarArtifacts({
  workspaceId,
  onClose,
  onPreviewArtifact,
}: SidebarArtifactsProps) {
  const {
    data: artifacts,
    isPending,
    isError,
    error,
    refetch,
  } = useArtifacts(workspaceId);
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const { push } = useToast();

  const { previewArtifactId } = useWorkspacePreview();
  const [activeType, setActiveType] = React.useState<ArtifactType | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<LearningArtifact | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteArtifact.mutateAsync(deleteTarget.id);
      push({
        title: "Artifact deleted",
        description: `"${deleteTarget.title}" was removed.`,
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      push({
        variant: "destructive",
        title: "Could not delete artifact",
        description: getErrorMessage(deleteError),
      });
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-3.5 sm:px-4 bg-card">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Artifacts
          </h2>
          {artifacts && artifacts.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-mono font-medium leading-none">
              {artifacts.length}
            </span>
          )}
        </div>
        {onClose ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                aria-label="Collapse to rail"
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
              >
                <HugeiconsIcon
                  icon={SidebarRightIcon}
                  strokeWidth={1.5}
                  className="size-5"
                  aria-hidden
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Collapse to rail (<kbd className="font-mono text-[10px]">⌘J</kbd>)
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Generate section */}
        <div className="shrink-0 p-3.5">
          <p className="text-muted-foreground/70 mb-2.5 pl-1 text-xs font-semibold tracking-wider uppercase">
            Create Study Tools
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ARTIFACT_TYPE_ORDER.map((type) => {
              const Icon = ARTIFACT_TYPE_ICONS[type];
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setActiveType(type)}
                      className="group flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-2.5 py-2 text-left transition-all duration-150 hover:border-primary/40 hover:bg-card hover:shadow-xs active:scale-[0.97]"
                    >
                      <div className={cn("flex size-7 shrink-0 items-center justify-center", ARTIFACT_TYPE_STYLES[type].iconColor)}>
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <span className="truncate text-xs font-medium tracking-tight text-foreground">
                        {ARTIFACT_TYPE_LABELS[type]}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>
                    {ARTIFACT_TYPE_DESCRIPTIONS[type]}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Artifacts list */}
        {isPending ? (
          <div className="px-3.5">
            <LoadingState label="Loading artifacts" />
          </div>
        ) : isError ? (
          <div className="px-3.5">
            <ErrorState
              title="Could not load artifacts"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : artifacts.length > 0 ? (
          <ul className="flex flex-col gap-1 p-2 sm:p-2.5">
            {artifacts.map((artifact) => {
              const isSelected = previewArtifactId === artifact.id;
              const Icon = ARTIFACT_TYPE_ICONS[artifact.type];
              const isProcessing =
                artifact.status === "PENDING" || artifact.status === "PROCESSING";

              return (
                <li key={artifact.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-150",
                      isSelected
                        ? "border-primary/40 bg-primary/5 shadow-xs"
                        : "border-transparent hover:border-border/60 hover:bg-card/60",
                    )}
                  >
                    <div className={cn("flex size-7 shrink-0 items-center justify-center", ARTIFACT_TYPE_STYLES[artifact.type].iconColor)}>
                      <Icon className="size-5" aria-hidden />
                    </div>

                    <button
                      type="button"
                      onClick={() => onPreviewArtifact(artifact.id)}
                      className="min-w-0 flex-1 flex items-center gap-2 text-left focus-visible:outline-none"
                    >
                      <span className="text-foreground block truncate text-sm font-medium leading-normal">
                        {cleanArtifactTitle(artifact.title)}
                      </span>
                      {isProcessing && (
                        <HugeiconsIcon
                          icon={Loading02Icon}
                          strokeWidth={2}
                          className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                          aria-label="Processing"
                        />
                      )}
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground/60 hover:text-foreground size-7 shrink-0 rounded-lg hover:bg-muted"
                          aria-label={`Options for ${artifact.title}`}
                        >
                          <HugeiconsIcon
                            icon={MoreHorizontalIcon}
                            strokeWidth={1.5}
                            className="size-4"
                            aria-hidden
                          />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 rounded-xl"
                      >
                        <DropdownMenuItem
                          onSelect={() => onPreviewArtifact(artifact.id)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(artifact)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mx-3.5 my-4 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-8 text-center shadow-xs">
            <div className="mb-2.5 flex size-9 items-center justify-center text-primary">
              <HugeiconsIcon
                icon={Cards01Icon}
                strokeWidth={1.5}
                className="size-6"
              />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              No artifacts yet
            </h3>
            <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-muted-foreground font-inter font-normal">
              Generate a summary, quiz, flashcards, or mindmap from your sources.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ArtifactConfigDialog
        workspaceId={workspaceId}
        type={activeType}
        onOpenChange={(open) => {
          if (!open) setActiveType(null);
        }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete artifact"
        description={
          <>
            This permanently deletes{" "}
            <span className="text-foreground font-medium">
              {deleteTarget?.title}
            </span>
            . This cannot be undone.
          </>
        }
        confirmLabel="Delete artifact"
        pendingLabel="Deleting…"
        isPending={deleteArtifact.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
