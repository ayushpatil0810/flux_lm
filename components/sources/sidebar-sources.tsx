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
  ArrowLeft02Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
import { YouTubePlayerView } from "./youtube-player-view";
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
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";

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

// ── Main panel ──────────────────────────────────────────────────────────────

interface SidebarSourcesProps {
  workspaceId: string;
  onClose?: () => void;
}

/**
 * Sources panel — supports both list view and inline source detail view
 * with breadcrumb navigation (Sources > Source Title).
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
  const { setImportDialogOpen } = useWorkspacePanel();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [detailSource, setDetailSource] = React.useState<Source | null>(null);
  const [renameSource, setRenameSource] = React.useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Source | null>(null);

  const [pdfViewMode, setPdfViewMode] = React.useState<"pdf" | "text">("text");
  const [isPdfLoading, setIsPdfLoading] = React.useState(true);

  // Derive the active source with freshest data from query
  const activeSource = React.useMemo(() => {
    if (!previewSource) return null;
    return sources?.find((s) => s.id === previewSource.id) ?? previewSource;
  }, [previewSource, sources]);

  const isPdf = activeSource?.type === "PDF";

  // Reset PDF mode & loading when active source changes
  React.useEffect(() => {
    if (activeSource?.type === "PDF") {
      setIsPdfLoading(true);
      setPdfViewMode("text");
    }
  }, [activeSource?.id, activeSource?.type, activeSource?.content]);

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
      if (previewSource?.id === deleteTarget.id) {
        setPreviewSource(null);
      }
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
      {activeSource ? (
        <>
          {/* Header: Source > {title} */}
          <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-3.5 sm:px-4 bg-card gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewSource(null)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg py-1 px-1.5 -ml-1 text-sm font-medium transition-colors hover:bg-muted"
                title="Back to sources"
              >
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  strokeWidth={1.5}
                  className="size-5 shrink-0"
                />
                <span>Sources</span>
              </button>
              <span className="text-muted-foreground/40 text-sm select-none">/</span>
              <div className="flex items-center gap-2 min-w-0 truncate">
                <div className="flex size-5 shrink-0 items-center justify-center">
                  {activeSource.type === "PDF" ? (
                    <HugeiconsIcon icon={Pdf01Icon} strokeWidth={1.5} className="size-5 text-red-500" />
                  ) : activeSource.type === "WEBSITE" ? (
                    <HugeiconsIcon icon={InternetIcon} strokeWidth={1.5} className="size-5 text-blue-500" />
                  ) : activeSource.type === "YOUTUBE" ? (
                    <HugeiconsIcon icon={YoutubeIcon} strokeWidth={1.5} className="size-5 text-red-500" />
                  ) : (
                    <HugeiconsIcon icon={NoteIcon} strokeWidth={1.5} className="size-5 text-amber-500" />
                  )}
                </div>
                <span
                  className="text-sm font-semibold tracking-tight text-foreground truncate"
                  title={activeSource.title}
                >
                  {activeSource.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activeSource.url ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={activeSource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                      aria-label="Open original link"
                    >
                      <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={1.5} className="size-5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>Open link</TooltipContent>
                </Tooltip>
              ) : activeSource.type === "PDF" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`/api/sources/${activeSource.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                      aria-label="Open PDF in new tab"
                    >
                      <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={1.5} className="size-5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>Open PDF in new tab</TooltipContent>
                </Tooltip>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-9 shrink-0 rounded-lg hover:bg-muted"
                    aria-label={`Options for ${activeSource.title}`}
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.5} className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onSelect={() => setDetailSource(activeSource)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRenameSource(activeSource)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(activeSource)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onClose ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Collapse sources panel"
                      className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
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

          {/* Mode Switcher for PDFs (Text vs PDF view) */}
          {isPdf && activeSource.content ? (
            <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-3.5 py-1.5 text-xs shrink-0">
              <span className="text-[11px] text-muted-foreground font-medium">View as</span>
              <div className="flex items-center rounded-md border border-border/60 bg-muted/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setPdfViewMode("text")}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                    pdfViewMode === "text"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setPdfViewMode("pdf")}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                    pdfViewMode === "pdf"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  PDF
                </button>
              </div>
            </div>
          ) : null}

          {/* Source Content Body */}
          <div
            className={cn(
              "no-scrollbar min-h-0 flex-1",
              activeSource.type === "YOUTUBE"
                ? "flex flex-col overflow-hidden"
                : "overflow-y-auto",
            )}
          >
            {isPdf && pdfViewMode === "pdf" ? (
              <div className="relative h-full w-full">
                {isPdfLoading ? (
                  <div className="bg-background/90 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                    <HugeiconsIcon
                      icon={Loading02Icon}
                      strokeWidth={1.5}
                      className="size-5 animate-spin text-primary"
                    />
                    <p className="font-inter text-muted-foreground text-xs font-medium">
                      Loading PDF document…
                    </p>
                  </div>
                ) : null}
                <iframe
                  src={`/api/sources/${activeSource.id}/file`}
                  title={activeSource.title}
                  onLoad={() => setIsPdfLoading(false)}
                  className="h-full w-full border-0"
                />
              </div>
            ) : activeSource.type === "YOUTUBE" && activeSource.url ? (
              <YouTubePlayerView
                url={activeSource.url}
                title={activeSource.title}
                content={activeSource.content}
              />
            ) : (
              <div className="p-3.5 sm:p-4">
                {activeSource.url && (
                  <a
                    href={activeSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono truncate max-w-full"
                  >
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={1.5} className="size-4 shrink-0" />
                    <span className="truncate">{activeSource.url}</span>
                  </a>
                )}
                <div className="prose prose-xs sm:prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:rounded-lg prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/50 max-w-none break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeSource.content || "*No content extracted.*"}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
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

          {/* Single Add Source Button (only when sources exist; empty state has its own button) */}
          {sources && sources.length > 0 && (
            <div className="shrink-0 px-3.5 pt-2.5 pb-2">
              <Button
                type="button"
                onClick={() => setImportDialogOpen(true)}
                className="w-full h-9.5 justify-center gap-2 rounded-xl text-xs font-semibold tracking-wide"
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2.5}
                  className="size-4"
                />
                <span>Add Source</span>
              </Button>
            </div>
          )}

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
              <div className="pt-1">
                <div className="flex items-center gap-2 px-3.5 pt-1 pb-2">
                  <p className="text-muted-foreground/70 pl-1 text-xs font-semibold tracking-wider uppercase">
                    Your Sources
                  </p>
                </div>
                <div className="mx-3.5 my-2 flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/40 px-4 py-8 text-center shadow-xs">
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
                    Import PDFs, websites, YouTube videos, or notes to get started.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setImportDialogOpen(true)}
                    className="mt-3.5 h-8 gap-1.5 rounded-lg text-xs font-medium"
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                    <span>Add Source</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <div className="flex items-center gap-2 px-3.5 pt-1 pb-1.5">
                  <p className="text-muted-foreground/70 pl-1 text-xs font-semibold tracking-wider uppercase">
                    {searchQuery ? "Filtered Sources" : "Your Sources"}
                  </p>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-mono font-medium leading-none">
                    {filteredSources.length}
                  </span>
                </div>

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
                  <ul className="flex flex-col gap-1 p-2 sm:p-2.5 pt-0.5">
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
              </div>
            )}
          </div>
        </>
      )}


      {/* Dialogs */}
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
