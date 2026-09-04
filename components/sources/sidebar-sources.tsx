"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MoreHorizontalIcon,
  Add01Icon,
  Search01Icon,
  SidebarLeftIcon,
  Pdf01Icon,
  InternetIcon,
  YoutubeIcon,
  NoteIcon,
  FileUploadIcon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { Source } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSources, useDeleteSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { Button } from "@/components/ui/button";
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

export type ImportType = "pdf" | "website" | "youtube" | "text";

export const IMPORT_TYPES: {
  id: ImportType;
  label: string;
  hint: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "pdf",
    label: "PDF",
    hint: "Upload a PDF document",
    Icon: (props) => (
      <HugeiconsIcon icon={Pdf01Icon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "website",
    label: "Web",
    hint: "Extract text from any URL",
    Icon: (props) => (
      <HugeiconsIcon icon={InternetIcon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    hint: "Import video transcript",
    Icon: (props) => (
      <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.5} {...props} />
    ),
  },
  {
    id: "text",
    label: "Note",
    hint: "Create a plain text note",
    Icon: (props) => (
      <HugeiconsIcon icon={NoteIcon} strokeWidth={1.5} {...props} />
    ),
  },
];

// ── Import dialog (single type) ─────────────────────────────────────────────

export interface ImportTypeDialogProps {
  workspaceId: string;
  importType: ImportType | null;
  onClose: () => void;
  onImported?: () => void;
}

export function ImportTypeDialog({
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
 * Sources panel — upload type strip (PDF / Web / YouTube / Note)
 * with live filter followed by the list of ingested sources.
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [detailSource, setDetailSource] = React.useState<Source | null>(null);
  const [renameSource, setRenameSource] = React.useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Source | null>(null);

  const filteredSources = React.useMemo(() => {
    if (!sources) return [];
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.url && s.url.toLowerCase().includes(q)),
    );
  }, [sources, searchQuery]);

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
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-3.5 sm:px-4 bg-card">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Sources
          </h2>
          {sources && sources.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-mono font-medium leading-none">
              {sources.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImportType("pdf")}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
            title="Import new source"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-3.5 text-primary"
            />
            <span>Add</span>
          </Button>

          {onClose ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Collapse sources panel"
                  className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted active:scale-95"
                >
                  <HugeiconsIcon
                    icon={SidebarLeftIcon}
                    strokeWidth={1.5}
                    className="size-5"
                    aria-hidden
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Collapse panel (<kbd className="font-mono text-[10px]">⌘B</kbd>)
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {/* Upload type 4-button strip */}
      <div className="shrink-0 px-3.5 pt-2.5 pb-2">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1 border border-border/50">
          {IMPORT_TYPES.map(({ id, label, hint, Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setImportType(id)}
                  className="group flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-center transition-all hover:bg-background hover:shadow-2xs active:scale-95"
                >
                  <div className="flex size-7 items-center justify-center text-primary transition-transform group-hover:scale-110">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <span className="text-[11px] font-medium tracking-tight text-foreground line-clamp-1">
                    {label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {hint}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Filter search bar (visible when more than 2 sources exist) */}
      {sources && sources.length > 2 && (
        <div className="px-3.5 pb-2 shrink-0">
          <div className="relative flex items-center">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.5}
              className="absolute left-3 size-4 text-muted-foreground/60 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-border/60 bg-muted/25 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}


      {/* Source list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="p-3">
            <LoadingState label="Loading sources" />
          </div>
        ) : isError ? (
          <div className="p-3">
            <ErrorState
              title="Could not load sources"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          </div>
        ) : sources.length === 0 ? (
          <div className="mx-3.5 my-4 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-8 text-center shadow-xs">
            <div className="mb-2.5 flex size-9 items-center justify-center text-primary">
              <HugeiconsIcon
                icon={FileUploadIcon}
                strokeWidth={1.5}
                className="size-6"
              />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              No sources yet
            </h3>
            <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-muted-foreground font-inter font-normal">
              Pick a type above to import PDFs, websites, YouTube videos, or notes.
            </p>
          </div>
        ) : (
          <>
            {searchQuery ? (
              <div className="flex items-center gap-2 px-4 pt-1 pb-1.5">
                <span className="bg-border/40 h-px flex-1" aria-hidden />
                <span className="text-muted-foreground/60 text-[11px] font-medium tracking-wider uppercase">
                  Filtered Results
                </span>
                <span className="bg-border/40 h-px flex-1" aria-hidden />
              </div>
            ) : null}

            {filteredSources.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  No sources match &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-1 p-2 sm:p-2.5">
                {filteredSources.map((source) => {
                  const isSelected = previewSource?.id === source.id;
                  const isProcessing =
                    source.status === "PENDING" || source.status === "PROCESSING";

                  return (
                    <li key={source.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-150",
                          isSelected
                            ? "border-primary/40 bg-primary/5 shadow-xs"
                            : "border-transparent hover:border-border/60 hover:bg-card/60",
                        )}
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center">
                          {source.type === "PDF" ? (
                            <HugeiconsIcon
                              icon={Pdf01Icon}
                              strokeWidth={1.5}
                              className="size-5 text-red-500"
                            />
                          ) : source.type === "WEBSITE" ? (
                            <HugeiconsIcon
                              icon={InternetIcon}
                              strokeWidth={1.5}
                              className="size-5 text-blue-500"
                            />
                          ) : source.type === "YOUTUBE" ? (
                            <HugeiconsIcon
                              icon={YoutubeIcon}
                              strokeWidth={1.5}
                              className="size-5 text-red-500"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={NoteIcon}
                              strokeWidth={1.5}
                              className="size-5 text-amber-500"
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewSource(source)}
                          className="min-w-0 flex-1 flex items-center gap-2 text-left focus-visible:outline-none"
                        >
                          <span className="text-foreground block truncate text-sm font-medium leading-normal">
                            {source.title}
                          </span>
                          {isProcessing && (
                            <HugeiconsIcon
                              icon={Loading02Icon}
                              strokeWidth={2}
                              className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                              aria-label="Processing"
                            />
                          )}
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
            )}
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
