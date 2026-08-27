"use client";

import * as React from "react";

import type { ArtifactType, LearningArtifact } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useArtifacts, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
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
  CloseIcon,
  MoreHorizontalIcon,
  FileIcon,
  SealCheckIcon,
  ToggleIcon,
  QuestionIcon,
  FadersHorizontalIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

// ── Type-to-icon mapping ────────────────────────────────────────────────────

const ARTIFACT_TYPE_ICONS: Record<
  ArtifactType,
  React.FC<{ className?: string }>
> = {
  SUMMARY: FileIcon,
  TAKEAWAYS: SealCheckIcon,
  FLASHCARDS: ToggleIcon,
  QUIZ: QuestionIcon,
  MINDMAP: FadersHorizontalIcon,
  REPORT: ShieldCheckIcon,
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
  const { data: artifacts, isPending, isError, error, refetch } = useArtifacts(
    workspaceId,
  );
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const { push } = useToast();

  const [activeType, setActiveType] = React.useState<ArtifactType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<LearningArtifact | null>(
    null,
  );

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between pl-4 pr-2">
        <h2 className="text-sm font-medium">Artifacts</h2>
        <div className="flex items-center gap-1">
          {artifacts && artifacts.length > 0 ? (
            <span className="text-xs text-muted-foreground/60">
              {artifacts.length}
            </span>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close artifacts panel"
              className="ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <CloseIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Generate section */}
        <div className="px-3 pb-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Generate
          </p>
          <div className="flex flex-col gap-1.5">
            {ARTIFACT_TYPE_ORDER.map((type) => {
              const Icon = ARTIFACT_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-tight">
                      {ARTIFACT_TYPE_LABELS[type]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {ARTIFACT_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </button>
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
              <span className="h-px flex-1 bg-border/40" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Generated
              </span>
              <span className="h-px flex-1 bg-border/40" aria-hidden />
            </div>
            <ul className="flex flex-col p-2">
              {artifacts.map((artifact) => (
                <li key={artifact.id} className="group relative">
                  <div className="flex items-start gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
                    <button
                      type="button"
                      onClick={() => onPreviewArtifact(artifact.id)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none"
                    >
                      <span className="block truncate text-[13px] font-medium leading-snug text-foreground">
                        {artifact.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {ARTIFACT_TYPE_LABELS[artifact.type]}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <StatusIndicator status={artifact.status} />
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(artifact.createdAt)}
                        </span>
                      </span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <MoreHorizontalIcon className="size-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
              ))}
            </ul>
          </>
        ) : null}
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
            <span className="font-medium text-foreground">
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
