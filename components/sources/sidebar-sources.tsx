"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MoreHorizontalIcon,
  FileUploadIcon,
  Link01Icon,
  PlayCircle02Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { Source } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
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
    Icon: (props) => (
      <HugeiconsIcon icon={FileUploadIcon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "website",
    label: "Website",
    hint: "Any web page",
    Icon: (props) => (
      <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    hint: "Video transcript",
    Icon: (props) => (
      <HugeiconsIcon icon={PlayCircle02Icon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "text",
    label: "Note",
    hint: "Plain text",
    Icon: (props) => (
      <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} {...props} />
    ),
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
    <Dialog
      open={importType !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-heading font-serif">
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
  const {
    data: sources,
    isPending,
    isError,
    error,
    refetch,
  } = useSources(workspaceId);
  const deleteSource = useDeleteSource(workspaceId);
  const { push } = useToast();
  const { previewSource, setPreviewSource } = useWorkspacePreview();

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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Sources
          </h2>
          {sources && sources.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
              {sources.length}
            </span>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sources panel"
            className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={1.5}
              className="size-3.5"
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {/* Upload type cards */}
      <div className="shrink-0 p-3">
        <div className="grid grid-cols-2 gap-2">
          {IMPORT_TYPES.map(({ id, label, hint, Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setImportType(id)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-3 text-center transition-all duration-150 hover:border-primary/40 hover:bg-card hover:shadow-xs"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="size-4.5" aria-hidden />
                  </div>
                  <p className="text-[12px] font-medium tracking-tight text-foreground">
                    {label}
                  </p>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>{hint}</TooltipContent>
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
          <div className="mx-3 my-4 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-10 text-center shadow-xs">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
              <HugeiconsIcon
                icon={FileUploadIcon}
                strokeWidth={1.5}
                className="size-5"
              />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              No sources yet
            </h3>
            <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-muted-foreground font-inter font-normal">
              Pick a type above to import PDFs, websites, YouTube videos, or notes.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 pt-1 pb-1.5">
              <span className="bg-border/40 h-px flex-1" aria-hidden />
              <span className="text-muted-foreground/60 text-[10px] font-medium tracking-wider uppercase">
                Your sources
              </span>
              <span className="bg-border/40 h-px flex-1" aria-hidden />
            </div>
            <ul className="flex flex-col gap-1 p-2">
              {sources.map((source) => {
                const subtitle = sourceSubtitle(source);
                const isSelected = previewSource?.id === source.id;
                return (
                  <li key={source.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-150",
                        isSelected
                          ? "border-primary/40 bg-primary/5 shadow-xs"
                          : "border-transparent hover:border-border/60 hover:bg-card/60",
                      )}
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                        {source.type === "PDF" ? (
                          <HugeiconsIcon
                            icon={FileUploadIcon}
                            strokeWidth={1.5}
                            className="size-4 text-blue-500"
                          />
                        ) : source.type === "WEBSITE" ? (
                          <HugeiconsIcon
                            icon={Link01Icon}
                            strokeWidth={1.5}
                            className="size-4 text-emerald-500"
                          />
                        ) : source.type === "YOUTUBE" ? (
                          <HugeiconsIcon
                            icon={PlayCircle02Icon}
                            strokeWidth={1.5}
                            className="size-4 text-red-500"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={File01Icon}
                            strokeWidth={1.5}
                            className="size-4 text-amber-500"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewSource(source)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <span className="text-foreground block truncate text-xs font-medium leading-snug">
                          {source.title}
                        </span>
                        {subtitle ? (
                          <span className="text-muted-foreground mt-0.5 block truncate text-[11px] font-inter font-normal">
                            {subtitle}
                          </span>
                        ) : null}
                        <span className="mt-1.5 flex items-center gap-2 text-[11px]">
                          <StatusIndicator status={source.status} />
                          <span className="text-muted-foreground/70">
                            {formatRelativeTime(source.createdAt)}
                          </span>
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground/60 hover:text-foreground size-7 shrink-0 rounded-lg hover:bg-muted"
                            aria-label={`Options for ${source.title}`}
                          >
                            <HugeiconsIcon
                              icon={MoreHorizontalIcon}
                              strokeWidth={1.5}
                              className="size-4"
                              aria-hidden
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 rounded-xl"
                        >
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
            <span className="text-foreground font-medium">
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
