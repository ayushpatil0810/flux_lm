"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MoreHorizontalIcon,
  File01Icon,
  CheckmarkBadge01Icon,
  Cards01Icon,
  HelpCircleIcon,
  ListSettingIcon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { ArtifactType, LearningArtifact } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useArtifacts, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
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
} from "./artifact-meta";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Type-to-icon mapping ────────────────────────────────────────────────────

const ARTIFACT_TYPE_ICONS: Record<
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
    <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} {...props} />
  ),
  MINDMAP: (props) => (
    <HugeiconsIcon icon={ListSettingIcon} strokeWidth={1.5} {...props} />
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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Artifacts
          </h2>
          {artifacts && artifacts.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
              {artifacts.length}
            </span>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close artifacts panel"
            className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={1.5}
              className="size-3.5"
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Generate section */}
        <div className="shrink-0 p-3">
          <p className="text-muted-foreground/70 mb-2 pl-1 text-[11px] font-semibold tracking-wider uppercase">
            Generate New
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
                      className="group flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-left transition-all duration-150 hover:border-primary/40 hover:bg-card hover:shadow-xs"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="size-4" aria-hidden />
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
          <div className="px-3">
            <LoadingState label="Loading artifacts" />
          </div>
        ) : isError ? (
          <div className="px-3">
            <ErrorState
              title="Could not load artifacts"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : artifacts.length > 0 ? (
          <>
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="bg-border/40 h-px flex-1" aria-hidden />
              <span className="text-muted-foreground/60 text-[10px] font-medium tracking-wider uppercase">
                Generated
              </span>
              <span className="bg-border/40 h-px flex-1" aria-hidden />
            </div>
            <ul className="flex flex-col gap-1 p-2">
              {artifacts.map((artifact) => {
                const isSelected = previewArtifactId === artifact.id;
                const Icon = ARTIFACT_TYPE_ICONS[artifact.type];
                return (
                  <li key={artifact.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-150",
                        isSelected
                          ? "border-primary/40 bg-primary/5 shadow-xs"
                          : "border-transparent hover:border-border/60 hover:bg-card/60",
                      )}
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </div>

                      <button
                        type="button"
                        onClick={() => onPreviewArtifact(artifact.id)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <span className="text-foreground block truncate text-xs font-medium leading-snug">
                          {artifact.title}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block truncate text-[11px] font-inter font-normal">
                          {ARTIFACT_TYPE_LABELS[artifact.type]}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2 text-[11px]">
                          <StatusIndicator status={artifact.status} />
                          <span className="text-muted-foreground/70">
                            {formatRelativeTime(artifact.createdAt)}
                          </span>
                        </span>
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
          </>
        ) : (
          <div className="mx-3 my-4 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-10 text-center shadow-xs">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
              <HugeiconsIcon
                icon={Cards01Icon}
                strokeWidth={1.5}
                className="size-5"
              />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              No artifacts yet
            </h3>
            <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted-foreground font-inter font-normal">
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
