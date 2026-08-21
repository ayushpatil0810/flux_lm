"use client";

import * as React from "react";
import { Plus, MoreHorizontal, X } from "lucide-react";

import type { LearningArtifact } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useArtifacts, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { GenerateArtifactDialog } from "./generate-artifact-dialog";
import { ArtifactDetailModal } from "./artifact-detail-modal";
import { getErrorMessage } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ARTIFACT_TYPE_LABELS } from "./artifact-meta";

interface SidebarArtifactsProps {
  workspaceId: string;
  onClose?: () => void;
}

/**
 * Artifacts panel: generated study material for the workspace. Same quiet
 * list treatment as the sources panel so the two read as one system.
 */
export function SidebarArtifacts({ workspaceId, onClose }: SidebarArtifactsProps) {
  const { data: artifacts, isPending, isError, error, refetch } = useArtifacts(workspaceId);
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const { push } = useToast();

  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [detailArtifactId, setDetailArtifactId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<LearningArtifact | null>(null);

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
        <div className="flex items-center gap-0.5">
          {artifacts && artifacts.length > 0 ? (
            <span className="text-xs text-muted-foreground/60">{artifacts.length}</span>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="ml-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Primary action */}
      <div className="shrink-0 px-3 pb-2">
        <button
          type="button"
          onClick={() => setGenerateOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus className="size-4" aria-hidden />
          Generate artifact
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isPending ? (
          <LoadingState label="Loading artifacts" />
        ) : isError ? (
          <div className="p-2">
            <ErrorState
              title="Could not load artifacts"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : artifacts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <p className="text-sm font-medium">No artifacts yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Generate summaries, flashcards, and quizzes from your sources.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setGenerateOpen(true)}
            >
              Generate artifact
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {artifacts.map((artifact) => (
              <li key={artifact.id} className="group relative">
                <div className="flex items-start gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
                  <button
                    type="button"
                    onClick={() => setDetailArtifactId(artifact.id)}
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
                        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                        aria-label={`Options for ${artifact.title}`}
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDetailArtifactId(artifact.id)}>
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
        )}
      </div>

      <GenerateArtifactDialog
        workspaceId={workspaceId}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
      />

      <ArtifactDetailModal
        workspaceId={workspaceId}
        artifactId={detailArtifactId}
        open={detailArtifactId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailArtifactId(null);
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

