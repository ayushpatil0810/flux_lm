"use client";

import * as React from "react";
import { MoreHorizontal, Plus, X } from "lucide-react";

import type { Source } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useSources, useDeleteSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";
import { ImportSourceDialog } from "./import-dialog";
import { SourceDetailDialog } from "./source-detail-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { RenameSourceDialog } from "./rename-source-dialog";
import { getErrorMessage } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sourceSubtitle } from "./source-meta";



interface SidebarSourcesProps {
  workspaceId: string;
  onClose?: () => void;
}

/**
 * Sources panel: a quiet list of what the workspace knows. Plain rows,
 * hairline separators, one action per row behind a kebab menu.
 */
export function SidebarSources({ workspaceId, onClose }: SidebarSourcesProps) {
  const { data: sources, isPending, isError, error, refetch } = useSources(workspaceId);
  const deleteSource = useDeleteSource(workspaceId);
  const { push } = useToast();
  const { setPreviewSource } = useWorkspacePanel();

  const [importOpen, setImportOpen] = React.useState(false);
  const [detailSource, setDetailSource] = React.useState<Source | null>(null);
  const [renameSource, setRenameSource] = React.useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Source | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSource.mutateAsync(deleteTarget.id);
      push({
        title: "Source deleted",
        description: `"${deleteTarget.title}" was removed.`,
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      push({
        variant: "destructive",
        title: "Could not delete source",
        description: getErrorMessage(deleteError),
      });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between pl-4 pr-2">
        <h2 className="text-sm font-medium">Sources</h2>
        <div className="flex items-center gap-0.5">
          {sources && sources.length > 0 ? (
            <span className="text-xs text-muted-foreground/60">{sources.length}</span>
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
          onClick={() => setImportOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus className="size-4" aria-hidden />
          Add source
        </button>
      </div>

      {/* Source list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isPending ? (
          <LoadingState label="Loading sources" />
        ) : isError ? (
          <div className="p-2">
            <ErrorState
              title="Could not load sources"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <p className="text-sm font-medium">No sources yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add a PDF, link, or note and Flux will answer from it.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setImportOpen(true)}
            >
              Add source
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {sources.map((source) => {
              const subtitle = sourceSubtitle(source);
              return (
                <li key={source.id} className="group relative">
                  <div className="flex items-start gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
                    <button
                      type="button"
                      onClick={() => setPreviewSource(source)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none"
                    >
                      <span className="block truncate text-[13px] font-medium leading-snug text-foreground">
                        {source.title}
                      </span>
                      {subtitle ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {subtitle}
                        </span>
                      ) : null}
                      <span className="mt-1.5 flex items-center gap-2">
                        <StatusIndicator status={source.status} />
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(source.createdAt)}
                        </span>
                      </span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          aria-label={`Options for ${source.title}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setDetailSource(source)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setRenameSource(source)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(source)}
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
        )}
      </div>

      <ImportSourceDialog
        workspaceId={workspaceId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => refetch()}
      />
      <SourceDetailDialog
        source={detailSource}
        onClose={() => setDetailSource(null)}
        onRename={(source) => {
          setDetailSource(null);
          setRenameSource(source);
        }}
      />
      <RenameSourceDialog
        workspaceId={workspaceId}
        source={renameSource}
        onClose={() => setRenameSource(null)}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete source"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.title}
            </span>
            , including its extracted text and embeddings. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete source"
        pendingLabel="Deleting…"
        isPending={deleteSource.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
