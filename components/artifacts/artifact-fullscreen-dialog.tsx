"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowShrink01Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
  Loading02Icon,
  ArrowExpand01Icon,
} from "@hugeicons/core-free-icons";

import { useArtifact, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { ArtifactDetailDialog } from "./artifact-detail-dialog";
import { RenameArtifactDialog } from "./rename-artifact-dialog";
import { useWorkspacePreview } from "@/components/shell/workspace-panel-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPE_STYLES,
  ARTIFACT_TYPE_ICONS,
  cleanArtifactTitle,
} from "./artifact-meta";
import { ArtifactViewer } from "./artifact-viewers";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";

interface ArtifactFullscreenDialogProps {
  workspaceId: string;
  artifactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactFullscreenDialog({
  workspaceId,
  artifactId,
  open,
  onOpenChange,
}: ArtifactFullscreenDialogProps) {
  const { push } = useToast();
  const { setPreviewArtifactId } = useWorkspacePreview();
  const [isEdgeToEdge, setIsEdgeToEdge] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const {
    data: artifact,
    isPending,
    isError,
    error,
    refetch,
  } = useArtifact(workspaceId, artifactId ?? "");

  const deleteArtifact = useDeleteArtifact(workspaceId);

  const isGenerating =
    artifact?.status === "PENDING" || artifact?.status === "PROCESSING";

  // Polling for generation status if needed
  React.useEffect(() => {
    if (!open || !artifact || !isGenerating) return;
    const timer = setInterval(() => refetch(), 2000);
    return () => clearInterval(timer);
  }, [open, artifact, isGenerating, refetch]);

  async function confirmDelete() {
    if (!artifactId) return;
    try {
      await deleteArtifact.mutateAsync(artifactId);
      push({ title: "Artifact deleted" });
      setDeleteOpen(false);
      setPreviewArtifactId(null);
      onOpenChange(false);
    } catch (deleteError) {
      setDeleteOpen(false);
      push({
        variant: "destructive",
        title: "Could not delete artifact",
        description: getErrorMessage(deleteError),
      });
    }
  }

  if (!artifactId) return null;

  const ActiveIcon = artifact
    ? ARTIFACT_TYPE_ICONS[artifact.type]
    : ARTIFACT_TYPE_ICONS.SUMMARY;

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          {/* Backdrop with soft blur */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

          {/* Fullscreen / Theater Content Panel */}
          <DialogPrimitive.Content
            className={cn(
              "fixed z-50 flex flex-col bg-card shadow-2xl border border-border/80 outline-hidden overflow-hidden transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              isEdgeToEdge
                ? "inset-0 rounded-none border-none"
                : "inset-2 sm:inset-4 md:inset-6 lg:inset-8 rounded-2xl md:rounded-3xl",
            )}
          >
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 sm:px-6 bg-card/90 backdrop-blur-md gap-3 z-10 rounded-t-[inherit]">
              {/* Left: Artifact Icon + Title */}
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {artifact && (
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center",
                        ARTIFACT_TYPE_STYLES[artifact.type].iconColor,
                      )}
                    >
                      <ActiveIcon className="size-5" aria-hidden />
                    </div>

                    <DialogPrimitive.Title asChild>
                      <h2
                        className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate max-w-[280px] sm:max-w-[480px] md:max-w-[650px]"
                        title={cleanArtifactTitle(artifact.title)}
                      >
                        {cleanArtifactTitle(artifact.title)}
                      </h2>
                    </DialogPrimitive.Title>

                    <DialogPrimitive.Description className="sr-only">
                      Full screen viewer for {cleanArtifactTitle(artifact.title)}
                    </DialogPrimitive.Description>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Edge-to-Edge Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setIsEdgeToEdge((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                      aria-label={
                        isEdgeToEdge
                          ? "Windowed view"
                          : "Edge-to-edge full screen"
                      }
                    >
                      <HugeiconsIcon
                        icon={isEdgeToEdge ? ArrowShrink01Icon : ArrowExpand01Icon}
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {isEdgeToEdge
                      ? "Windowed view"
                      : "Edge-to-edge full screen"}
                  </TooltipContent>
                </Tooltip>

                {/* More / Delete menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-8 shrink-0 rounded-lg hover:bg-muted"
                      aria-label="More options"
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      onSelect={() => setDetailOpen(true)}
                    >
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setRenameOpen(true)}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteOpen(true)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Close Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
                      aria-label="Close"
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    Close (<kbd className="font-mono text-[10px]">Esc</kbd>)
                  </TooltipContent>
                </Tooltip>
              </div>
            </header>

            {/* Scrollable Content Body */}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              {isPending ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    strokeWidth={1.5}
                    className="size-6 text-primary animate-spin"
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    Loading artifact...
                  </p>
                </div>
              ) : isError || !artifact ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm font-medium text-destructive">
                    {isError
                      ? getErrorMessage(error)
                      : "This artifact could not be found."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="h-8 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : isGenerating ? (
                <div
                  role="status"
                  className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center"
                >
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    strokeWidth={1.5}
                    className="text-primary size-7 animate-spin"
                    aria-hidden
                  />
                  <p className="text-base font-semibold text-foreground">
                    Generating {ARTIFACT_TYPE_LABELS[artifact.type].toLowerCase()}...
                  </p>
                </div>
              ) : artifact.status === "FAILED" ? (
                <div
                  role="alert"
                  className="border-destructive/40 bg-destructive/5 mx-auto max-w-xl rounded-2xl border p-6 text-center shadow-xs"
                >
                  <h3 className="text-destructive text-base font-semibold">
                    Generation failed
                  </h3>
                  <p className="text-destructive/80 mt-1.5 text-xs sm:text-sm leading-relaxed">
                    {artifact.metadata?.processingError ||
                      "There was an error creating this artifact. You may need to try again with different sources."}
                  </p>
                </div>
              ) : (
                <ArtifactViewer artifact={artifact} isExpanded={true} />
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Detail Dialog */}
      <ArtifactDetailDialog
        artifact={detailOpen ? artifact ?? null : null}
        onClose={() => setDetailOpen(false)}
        onRename={() => {
          setDetailOpen(false);
          setRenameOpen(true);
        }}
      />

      {/* Rename Dialog */}
      <RenameArtifactDialog
        workspaceId={workspaceId}
        artifact={renameOpen ? artifact ?? null : null}
        onClose={() => setRenameOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete artifact"
        description={
          <>
            This permanently deletes{" "}
            <span className="text-foreground font-medium">
              {artifact?.title}
            </span>
            . This cannot be undone.
          </>
        }
        confirmLabel="Delete artifact"
        pendingLabel="Deleting…"
        isPending={deleteArtifact.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
