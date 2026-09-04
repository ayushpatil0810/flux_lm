"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import * as React from "react";
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
  const {
    data: artifact,
    isPending,
    isError,
    error,
    refetch,
  } = useArtifact(workspaceId, artifactId);
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
      <div className="bg-background flex h-full min-h-0 flex-col">
        <header className="border-border/40 bg-background flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground truncate text-sm font-semibold tracking-tight">
                {artifact.title}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {ARTIFACT_TYPE_LABELS[artifact.type]}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px] font-inter font-normal">
              <StatusIndicator status={artifact.status} />
              <span aria-hidden>·</span>
              <span>{formatDate(artifact.createdAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs rounded-lg hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={1.5}
                className="size-3.5"
                aria-hidden
              />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {generating ? (
            <div
              role="status"
              className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center"
            >
              <HugeiconsIcon
                icon={Loading02Icon}
                strokeWidth={1.5}
                className="text-muted-foreground size-4 animate-spin"
                aria-hidden
              />
              <p className="text-sm font-medium">
                Generating {ARTIFACT_TYPE_LABELS[artifact.type].toLowerCase()}
              </p>
              <p className="text-muted-foreground max-w-xs text-sm">
                This usually takes a few seconds.
              </p>
            </div>
          ) : artifact.status === "FAILED" ? (
            <div
              role="alert"
              className="border-destructive/40 bg-destructive/5 mx-auto max-w-2xl rounded-md border px-5 py-4"
            >
              <h3 className="text-destructive font-medium">
                Generation failed
              </h3>
              <p className="text-destructive/80 mt-1 text-sm">
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
      <div className="bg-background animate-in slide-in-from-left-4 flex h-full min-h-0 w-full flex-col overflow-hidden duration-300">
        {content}
      </div>

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
