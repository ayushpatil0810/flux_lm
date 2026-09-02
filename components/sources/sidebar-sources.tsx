"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, MoreHorizontalIcon, FileUploadIcon, Link01Icon, PlayCircle02Icon, File01Icon } from '@hugeicons/core-free-icons';

import * as React from "react";

import type { Source } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useSources, useDeleteSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useWorkspacePreview } from "@/components/shell/workspace-panel-context";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImportPdfForm } from "./import-pdf-form";
import { ImportWebsiteForm, ImportYoutubeForm } from "./import-url-forms";
import { ImportTextForm } from "./import-text-form";

// ── Source-type picker cards ────────────────────────────────────────────────

type ImportType = "pdf" | "website" | "youtube" | "text";

const IMPORT_TYPES: {
  id: ImportType;
  label: string;
  hint: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "pdf",
    label: "PDF",
    hint: "Upload a file",
    Icon: (props) => <HugeiconsIcon icon={FileUploadIcon} strokeWidth={1.5} {...props} />,
  },
  {
    id: "website",
    label: "Website",
    hint: "Any web page",
    Icon: (props) => <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} {...props} />,
  },
  {
    id: "youtube",
    label: "YouTube",
    hint: "Video transcript",
    Icon: (props) => <HugeiconsIcon icon={PlayCircle02Icon} strokeWidth={1.5} {...props} />,
  },
  {
    id: "text",
    label: "Note",
    hint: "Plain text",
    Icon: (props) => <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} {...props} />,
  },
];

// ── Import dialog (single type) ─────────────────────────────────────────────

interface ImportTypeDialogProps {
  workspaceId: string;
  importType: ImportType | null;
  onClose: () => void;
  onImported?: () => void;
}

function ImportTypeDialog({
  workspaceId,
  importType,
  onClose,
  onImported,
}: ImportTypeDialogProps) {
  const done = React.useCallback(() => {
    onClose();
    onImported?.();
  }, [onClose, onImported]);

  const titleMap: Record<ImportType, string> = {
    pdf: "Upload PDF",
    website: "Add website",
    youtube: "Add YouTube video",
    text: "Add note",
  };

  return (
    <Dialog open={importType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-heading">
            {importType ? titleMap[importType] : ""}
          </DialogTitle>
          <DialogDescription>
            Flux reads it, indexes it, and cites it in answers.
          </DialogDescription>
        </DialogHeader>
        {importType === "pdf" && (
          <ImportPdfForm workspaceId={workspaceId} onDone={done} />
        )}
        {importType === "website" && (
          <ImportWebsiteForm workspaceId={workspaceId} onDone={done} />
        )}
        {importType === "youtube" && (
          <ImportYoutubeForm workspaceId={workspaceId} onDone={done} />
        )}
        {importType === "text" && (
          <ImportTextForm workspaceId={workspaceId} onDone={done} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main panel ──────────────────────────────────────────────────────────────

interface SidebarSourcesProps {
  workspaceId: string;
  onClose?: () => void;
}

/**
 * Sources panel — upload type cards (PDF / Website / YouTube / Note)
 * followed by the list of ingested sources.
 */
export function SidebarSources({ workspaceId, onClose }: SidebarSourcesProps) {
  const { data: sources, isPending, isError, error, refetch } =
    useSources(workspaceId);
  const deleteSource = useDeleteSource(workspaceId);
  const { push } = useToast();
  const { setPreviewSource } = useWorkspacePreview();

  const [importType, setImportType] = React.useState<ImportType | null>(null);
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
        <div className="flex items-center gap-1">
          {sources && sources.length > 0 ? (
            <span className="text-xs text-muted-foreground/60">
              {sources.length}
            </span>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sources panel"
              className="ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Upload type cards */}
      <div className="shrink-0 px-3 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {IMPORT_TYPES.map(({ id, label, hint, Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setImportType(id)}
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
                      {label}
                    </p>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {hint}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Divider + source list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <LoadingState label="Loading sources" />
        ) : isError ? (
          <div className="p-3">
            <ErrorState
              title="Could not load sources"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <p className="text-sm font-medium">No sources yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Pick a type above to import your first source.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 pb-1.5 pt-1">
              <span className="h-px flex-1 bg-border/40" aria-hidden />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Your sources
              </span>
              <span className="h-px flex-1 bg-border/40" aria-hidden />
            </div>
            <ul className="flex flex-col p-2">
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
                            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.5} className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setDetailSource(source)}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRenameSource(source)}
                          >
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
          </>
        )}
      </div>

      {/* Dialogs */}
      <ImportTypeDialog
        workspaceId={workspaceId}
        importType={importType}
        onClose={() => setImportType(null)}
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
