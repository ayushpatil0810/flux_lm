"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import type { LearningArtifact } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useArtifact, useDeleteArtifact } from "@/hooks/use-artifacts";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";
import { ARTIFACT_TYPE_LABELS } from "./artifact-meta";
import { ArtifactViewer } from "./artifact-viewers";
import { getErrorMessage } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArtifactDetailModalProps {
  workspaceId: string;
  artifactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactDetailModal({
  workspaceId,
  artifactId,
  open,
  onOpenChange,
}: ArtifactDetailModalProps) {
  const { push } = useToast();
  // We unconditionally call the hook, but disable fetching when modal is closed or no ID is provided
  // Note: Since react-query v5, passing `enabled` does the trick. We'll pass it if the hook supports it, 
  // but to be safe with the current hook implementation, we pass an empty string if null, which might 404, 
  // but it's only rendered when `open` is true anyway.
  const { data: artifact, isPending, isError, error, refetch } = useArtifact(
    workspaceId,
    artifactId ?? "",
  );
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  async function confirmDelete() {
    if (!artifactId) return;
    try {
      await deleteArtifact.mutateAsync(artifactId);
      push({ title: "Artifact deleted" });
      onOpenChange(false);
      setDeleteOpen(false);
    } catch (deleteError) {
      setDeleteOpen(false);
      push({
        variant: "destructive",
        title: "Could not delete artifact",
        description: getErrorMessage(deleteError),
      });
    }
  }

  // Prevent rendering content if not open or no ID
  if (!open || !artifactId) {
    return null;
  }

  let content;

  if (isPending) {
    content = (
      <div className="py-12">
        <LoadingState label="Loading artifact" />
      </div>
    );
  } else if (isError || !artifact) {
    content = (
      <div className="py-12">
        <ErrorState
          title="Could not load this artifact"
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  } else {
    const generating =
      artifact.status === "PENDING" || artifact.status === "PROCESSING";
    const processingError =
      typeof artifact.metadata?.processingError === "string"
        ? artifact.metadata.processingError
        : null;

    content = (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="border-b px-6 py-4 flex flex-wrap items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h1 className="font-serif text-xl font-semibold">{artifact.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{ARTIFACT_TYPE_LABELS[artifact.type]}</span>
              <span aria-hidden>·</span>
              <StatusIndicator status={artifact.status} />
              <span aria-hidden>·</span>
              <span>Created {formatDate(artifact.createdAt)}</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {generating ? (
            <div
              role="status"
              className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center"
            >
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm font-medium">
                Generating {ARTIFACT_TYPE_LABELS[artifact.type].toLowerCase()}
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                This usually takes a few seconds.
              </p>
            </div>
          ) : artifact.status === "FAILED" ? (
            <div
              role="alert"
              className="mx-auto max-w-2xl rounded-md border border-destructive/40 bg-destructive/5 px-5 py-4"
            >
              <p className="text-sm font-medium text-destructive">
                Generation failed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {processingError ??
                  "The artifact could not be generated. Try again with fewer sources, or different ones."}
              </p>
            </div>
          ) : (
            <ArtifactViewer artifact={artifact} />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 h-[85vh] flex flex-col gap-0 outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{artifact?.title ?? "Artifact details"}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete artifact"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">
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
