"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

import * as React from "react";
;

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

interface ArtifactPreviewProps {
  workspaceId: string;
  artifactId: string;
  onClose: () => void;
}

export function ArtifactPreview({
  workspaceId,
  artifactId,
  onClose,
}: ArtifactPreviewProps) {
  const { push } = useToast();
  const { data: artifact, isPending, isError, error, refetch } = useArtifact(
    workspaceId,
    artifactId,
  );
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  async function confirmDelete() {
    try {
      await deleteArtifact.mutateAsync(artifactId);
      push({ title: "Artifact deleted" });
      onClose();
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

  const generating =
    artifact?.status === "PENDING" || artifact?.status === "PROCESSING";

  // Polling for generation
  React.useEffect(() => {
    if (!artifact) return;
    if (generating) {
      const timer = setInterval(() => refetch(), 2000);
      return () => clearInterval(timer);
    }
  }, [artifact, generating, refetch]);

  let content;

  if (isPending) {
    content = <LoadingState label="Loading artifact..." />;
  } else if (isError) {
    content = (
      <ErrorState
        title="Could not load artifact"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  } else if (!artifact) {
    content = (
      <ErrorState title="Not found" message="This artifact does not exist." />
    );
  } else {
    content = (
      <div className="flex h-full flex-col min-h-0 bg-background">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/40 px-5 py-4 bg-card/40">
          <div className="min-w-0">
            <h1 className="font-serif text-lg font-semibold">{artifact.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{ARTIFACT_TYPE_LABELS[artifact.type]}</span>
              <span aria-hidden>·</span>
              <StatusIndicator status={artifact.status} />
              <span aria-hidden>·</span>
              <span>Created {formatDate(artifact.createdAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={onClose}
              aria-label="Close preview"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {generating ? (
            <div
              role="status"
              className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center"
            >
              <HugeiconsIcon icon={Loading02Icon} strokeWidth={1.5}
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
              <h3 className="font-medium text-destructive">Generation failed</h3>
              <p className="mt-1 text-sm text-destructive/80">
                {artifact.metadata?.processingError ||
                  "There was an error creating this artifact. You may need to try again with different sources."}
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
      <div className="flex h-full w-full flex-col min-h-0 bg-background overflow-hidden animate-in slide-in-from-left-4 duration-300">
        {content}
      </div>

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
