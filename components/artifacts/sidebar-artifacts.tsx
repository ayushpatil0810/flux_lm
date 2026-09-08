"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MoreHorizontalIcon,
  Cards01Icon,
  SidebarRightIcon,
  Loading02Icon,
  ArrowLeft02Icon,
  ArrowExpand01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { ArtifactType, LearningArtifact } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useArtifacts,
  useArtifact,
  useDeleteArtifact,
} from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { useWorkspacePreview } from "@/components/shell/workspace-panel-context";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { ArtifactConfigDialog } from "./artifact-config-dialog";
import { ArtifactFullscreenDialog } from "./artifact-fullscreen-dialog";
import { ArtifactDetailDialog } from "./artifact-detail-dialog";
import { RenameArtifactDialog } from "./rename-artifact-dialog";
import { getErrorMessage } from "@/lib/api";
import { ArtifactViewer } from "./artifact-viewers";
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
  ARTIFACT_TYPE_ICONS,
  cleanArtifactTitle,
} from "./artifact-meta";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Panel ───────────────────────────────────────────────────────────────────

interface SidebarArtifactsProps {
  workspaceId: string;
  onClose?: () => void;
  onPreviewArtifact?: (id: string) => void;
}

function CollapseRailButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label="Collapse to rail"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
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
  );
}

/**
 * Artifacts panel:
 * - Per-type generation cards (click → focused config dialog)
 * - Generated artifacts list
 * - Inline artifact detail view (Artifacts > Artifact Title)
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

  const {
    previewArtifactId,
    setPreviewArtifactId,
    previewExpanded,
    setPreviewExpanded,
  } = useWorkspacePreview();
  const [activeType, setActiveType] = React.useState<ArtifactType | null>(null);
  const [detailTarget, setDetailTarget] =
    React.useState<LearningArtifact | null>(null);
  const [renameTarget, setRenameTarget] =
    React.useState<LearningArtifact | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<LearningArtifact | null>(null);

  const { data: singleArtifact, isPending: isSinglePending } = useArtifact(
    workspaceId,
    previewArtifactId ?? "",
  );

  const activeArtifact = React.useMemo(() => {
    if (!previewArtifactId) return null;
    return (
      singleArtifact ??
      artifacts?.find((a) => a.id === previewArtifactId) ??
      null
    );
  }, [previewArtifactId, singleArtifact, artifacts]);

  const ActiveIcon = activeArtifact
    ? ARTIFACT_TYPE_ICONS[activeArtifact.type]
    : ARTIFACT_TYPE_ICONS.SUMMARY;

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteArtifact.mutateAsync(deleteTarget.id);
      push({
        title: "Artifact deleted",
        description: `"${deleteTarget.title}" was removed.`,
      });
      if (previewArtifactId === deleteTarget.id) {
        setPreviewArtifactId(null);
      }
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
      {activeArtifact ? (
        <>
          {/* Header: Artifacts > {title} */}
          <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-3.5 sm:px-4 bg-card gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewArtifactId(null)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg py-1 px-1.5 -ml-1 text-sm font-medium transition-colors hover:bg-muted"
                title="Back to artifacts"
              >
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  strokeWidth={1.5}
                  className="size-5 shrink-0"
                />
                <span>Artifacts</span>
              </button>
              <span className="text-muted-foreground/40 text-sm select-none">/</span>
              <div className="flex items-center gap-2 min-w-0 truncate">
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center",
                    ARTIFACT_TYPE_STYLES[activeArtifact.type].iconColor,
                  )}
                >
                  <ActiveIcon className="size-5" aria-hidden />
                </div>
                <span
                  className="text-sm font-semibold tracking-tight text-foreground truncate"
                  title={cleanArtifactTitle(activeArtifact.title)}
                >
                  {cleanArtifactTitle(activeArtifact.title)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Fullscreen Expand Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewExpanded(true)}
                    className="text-muted-foreground hover:text-foreground size-9 shrink-0 rounded-lg hover:bg-muted"
                    aria-label="View full screen (⌘E)"
                  >
                    <HugeiconsIcon
                      icon={ArrowExpand01Icon}
                      strokeWidth={1.5}
                      className="size-5"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  View full screen (<kbd className="font-mono text-[10px]">⌘E</kbd>)
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-9 shrink-0 rounded-lg hover:bg-muted"
                    aria-label={`Options for ${activeArtifact.title}`}
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      strokeWidth={1.5}
                      className="size-5"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem
                    onSelect={() => setDetailTarget(activeArtifact)}
                  >
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setRenameTarget(activeArtifact)}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(activeArtifact)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onClose ? <CollapseRailButton onClick={onClose} /> : null}
            </div>
          </div>

          {/* Body */}
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-4">
            {activeArtifact.status === "PENDING" ||
            activeArtifact.status === "PROCESSING" ? (
              <div
                role="status"
                className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center"
              >
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="text-muted-foreground size-5 animate-spin"
                  aria-hidden
                />
                <p className="text-sm font-medium">
                  Generating {ARTIFACT_TYPE_LABELS[activeArtifact.type].toLowerCase()}
                </p>
                <p className="text-muted-foreground max-w-xs text-xs">
                  This usually takes a few seconds.
                </p>
              </div>
            ) : activeArtifact.status === "FAILED" ? (
              <div
                role="alert"
                className="border-destructive/40 bg-destructive/5 mx-auto rounded-xl border p-4 text-center"
              >
                <h3 className="text-destructive text-sm font-medium">
                  Generation failed
                </h3>
                <p className="text-destructive/80 mt-1 text-xs">
                  {activeArtifact.metadata?.processingError ||
                    "There was an error creating this artifact. You may need to try again with different sources."}
                </p>
              </div>
            ) : (
              <ArtifactViewer artifact={activeArtifact} />
            )}
          </div>
        </>
      ) : previewArtifactId && isSinglePending ? (
        <>
          <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-3.5 sm:px-4 bg-card gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewArtifactId(null)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg py-1 px-1.5 -ml-1 text-sm font-medium transition-colors hover:bg-muted"
                title="Back to artifacts"
              >
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  strokeWidth={1.5}
                  className="size-5 shrink-0"
                />
                <span>Artifacts</span>
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <LoadingState label="Loading artifact..." />
          </div>
        </>
      ) : (
        <>
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
            {onClose ? <CollapseRailButton onClick={onClose} /> : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Generate section */}
            <div className="shrink-0 p-3.5 pb-2">
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
                          className="group flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-2.5 py-2 text-left transition-colors duration-150 hover:border-primary/40 hover:bg-card hover:shadow-xs"
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

            {/* Artifacts section */}
            <div className="pt-1">
              <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5">
                <p className="text-muted-foreground/70 pl-1 text-xs font-semibold tracking-wider uppercase">
                  Your Artifacts
                </p>
                {artifacts && artifacts.length > 0 ? (
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-mono font-medium leading-none">
                    {artifacts.length}
                  </span>
                ) : null}
              </div>

              {isPending ? (
                <div className="px-3.5 pt-2">
                  <LoadingState label="Loading artifacts" />
                </div>
              ) : isError ? (
                <div className="px-3.5 pt-2">
                  <ErrorState
                    title="Could not load artifacts"
                    message={getErrorMessage(error)}
                    onRetry={() => refetch()}
                  />
                </div>
              ) : artifacts && artifacts.length > 0 ? (
                <ul className="flex flex-col gap-1 p-2 sm:p-2.5 pt-0.5">
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
                            onClick={() => {
                              setPreviewArtifactId(artifact.id);
                              onPreviewArtifact?.(artifact.id);
                            }}
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
                                onSelect={() => {
                                  setPreviewArtifactId(artifact.id);
                                  onPreviewArtifact?.(artifact.id);
                                }}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setRenameTarget(artifact)}
                              >
                                Rename
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
                <div className="mx-3.5 my-3 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-8 text-center shadow-xs">
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
          </div>
        </>
      )}

      {/* Dialogs */}
      <ArtifactConfigDialog
        workspaceId={workspaceId}
        type={activeType}
        onOpenChange={(open) => {
          if (!open) setActiveType(null);
        }}
      />
      <ArtifactDetailDialog
        artifact={detailTarget}
        onClose={() => setDetailTarget(null)}
        onRename={(artifact) => {
          setDetailTarget(null);
          setRenameTarget(artifact);
        }}
      />
      <RenameArtifactDialog
        workspaceId={workspaceId}
        artifact={renameTarget}
        onClose={() => setRenameTarget(null)}
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

      {/* Fullscreen Theater Dialog */}
      <ArtifactFullscreenDialog
        workspaceId={workspaceId}
        artifactId={previewArtifactId}
        open={previewExpanded && !!previewArtifactId}
        onOpenChange={setPreviewExpanded}
      />
    </div>
  );
}
