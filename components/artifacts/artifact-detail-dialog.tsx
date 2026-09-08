"use client";

import * as React from "react";
import type { LearningArtifact } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ARTIFACT_TYPE_ICONS,
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPE_STYLES,
  cleanArtifactTitle,
} from "./artifact-meta";

interface ArtifactDetailDialogProps {
  artifact: LearningArtifact | null;
  onClose: () => void;
  onRename: (artifact: LearningArtifact) => void;
}

function getArtifactStats(artifact: LearningArtifact): string | null {
  if (!artifact.content) return null;
  const content = artifact.content;

  switch (artifact.type) {
    case "FLASHCARDS": {
      const cards = content.cards ?? content.flashcards;
      if (Array.isArray(cards)) {
        return `${cards.length} card${cards.length === 1 ? "" : "s"}`;
      }
      return null;
    }
    case "QUIZ": {
      const questions = content.questions ?? content.quiz;
      if (Array.isArray(questions)) {
        return `${questions.length} question${questions.length === 1 ? "" : "s"}`;
      }
      return null;
    }
    case "MINDMAP": {
      const nodes = content.nodes;
      if (Array.isArray(nodes)) {
        return `${nodes.length} node${nodes.length === 1 ? "" : "s"}`;
      }
      return null;
    }
    case "TAKEAWAYS": {
      const items = content.takeaways ?? content.items;
      if (Array.isArray(items)) {
        return `${items.length} key takeaway${items.length === 1 ? "" : "s"}`;
      }
      return null;
    }
    case "SUMMARY": {
      const text = content.summary ?? content.text;
      if (typeof text === "string" && text.length > 0) {
        const words = text.trim().split(/\s+/).length;
        return `~${words} words`;
      }
      return null;
    }
    case "REPORT": {
      const text = content.markdown ?? content.text;
      if (typeof text === "string" && text.length > 0) {
        const words = text.trim().split(/\s+/).length;
        return `~${words} words`;
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Read-only detail view of a learning artifact: type, status, creation/update dates,
 * referenced sources, and content volume statistics.
 */
export function ArtifactDetailDialog({
  artifact,
  onClose,
  onRename,
}: ArtifactDetailDialogProps) {
  const processingError =
    typeof artifact?.metadata?.processingError === "string" &&
    artifact.metadata.processingError.length > 0
      ? artifact.metadata.processingError
      : null;

  const stats = artifact ? getArtifactStats(artifact) : null;
  const sourceCount = artifact?.sourceIds?.length ?? 0;

  const ActiveIcon = artifact
    ? ARTIFACT_TYPE_ICONS[artifact.type]
    : ARTIFACT_TYPE_ICONS.SUMMARY;

  return (
    <Dialog
      open={artifact !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        {artifact ? (
          <>
            {/* Header — pinned */}
            <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left">
              <div className="flex items-start gap-3">
                <ActiveIcon
                  className={cn(
                    "size-5 mt-0.5 shrink-0",
                    ARTIFACT_TYPE_STYLES[artifact.type].iconColor,
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 pr-6">
                  <DialogTitle className="text-heading font-serif truncate">
                    {cleanArtifactTitle(artifact.title)}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground/70">
                    {ARTIFACT_TYPE_LABELS[artifact.type]} · Created{" "}
                    {formatDate(artifact.createdAt)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Body — scrollable */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <dl className="grid gap-2.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusIndicator status={artifact.status} />
                  </dd>
                </div>

                {stats ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Content size</dt>
                    <dd className="text-foreground font-mono text-[11px]">{stats}</dd>
                  </div>
                ) : null}

                {sourceCount > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Sources referenced</dt>
                    <dd className="text-foreground">
                      {sourceCount} {sourceCount === 1 ? "source" : "sources"}
                    </dd>
                  </div>
                ) : null}

                {artifact.updatedAt && artifact.updatedAt !== artifact.createdAt ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Last updated</dt>
                    <dd className="text-foreground">
                      {formatDate(artifact.updatedAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {artifact.status === "FAILED" ? (
                <div
                  role="alert"
                  className="border-destructive/30 bg-destructive/5 rounded-xl border px-3.5 py-2.5 text-xs"
                >
                  <p className="text-destructive font-medium">
                    Generation failed
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {processingError ??
                      "The artifact could not be generated. Please try creating it again."}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Footer — pinned */}
            <div className="flex shrink-0 items-center justify-end gap-2 px-5 pb-5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRename(artifact)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Rename
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                Close
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
