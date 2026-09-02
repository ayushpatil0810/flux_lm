"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, MoreHorizontalIcon, File01Icon, CheckmarkBadge01Icon, Cards01Icon, HelpCircleIcon, ListSettingIcon, ShieldCheckIcon } from '@hugeicons/core-free-icons';

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Type-to-icon mapping ────────────────────────────────────────────────────

const ARTIFACT_TYPE_ICONS: Record<
  ArtifactType,
  React.FC<{ className?: string }>
> = {
  SUMMARY: (props) => <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} {...props} />,
  TAKEAWAYS: (props) => <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={1.5} {...props} />,
  FLASHCARDS: (props) => <HugeiconsIcon icon={Cards01Icon} strokeWidth={1.5} {...props} />,
  QUIZ: (props) => <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} {...props} />,
  MINDMAP: (props) => <HugeiconsIcon icon={ListSettingIcon} strokeWidth={1.5} {...props} />,
  REPORT: (props) => <HugeiconsIcon icon={ShieldCheckIcon} strokeWidth={1.5} {...props} />,
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
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Generate section */}
        <div className="shrink-0 px-3 pb-4 pt-2">
          <p className="mb-3 pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                      className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-border/50 bg-card/40 px-2 py-3.5 text-center transition-colors duration-200 hover:border-primary/40 hover:bg-card/60"
                    >
                      {/* Subtle noise texture */}
                      <div
                        className="absolute inset-0 z-0 opacity-40 mix-blend-overlay bg-noise"
                      />
                      {/* Hover glow effect */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      
                      <div className="relative z-10 flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <Icon className="size-4.5" aria-hidden />
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-[12px] font-semibold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
                          {ARTIFACT_TYPE_LABELS[type]}
                        </p>
                      </div>
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
                          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.5} className="size-4" />
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
