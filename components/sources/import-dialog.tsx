"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileUploadIcon,
  Pdf01Icon,
  InternetIcon,
  YoutubeIcon,
  Link01Icon,
  NoteIcon,
  Cancel01Icon,
  Add01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import {
  useImportPdfSource,
  useImportWebsiteSource,
  useImportYoutubeSource,
  useImportTextSource,
} from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import type { ToastOptions } from "@/components/providers/toast-provider";
import { getErrorMessage, getFieldErrors } from "@/lib/api";

type PushToast = (options: ToastOptions) => void;

function submitInBackground<TInput>(
  mutation: {
    mutate: (
      input: TInput,
      options?: { onError?: (error: unknown) => void },
    ) => void;
  },
  input: TInput,
  push: PushToast,
  errorTitle: string,
  onDone: () => void,
) {
  onDone();
  mutation.mutate(input, {
    onError: (error) => {
      const fields = getFieldErrors(error);
      if (Object.keys(fields).length > 0) return;
      push({
        variant: "destructive",
        title: errorTitle,
        description: getErrorMessage(error),
      });
    },
  });
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

type UrlClassification =
  | { type: "youtube"; url: string; label: string; hint: string }
  | { type: "website"; url: string; label: string; hint: string }
  | null;

function detectUrlType(rawUrl: string): UrlClassification {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Detect YouTube video (standard watch, shorts, embed, youtu.be)
  const isYoutube =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i.test(
      trimmed,
    ) || /(?:youtube\.com|youtu\.be)/i.test(trimmed);

  if (isYoutube) {
    const normalized =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    return {
      type: "youtube",
      url: normalized,
      label: "YouTube Video",
      hint: "Captions & transcript will be imported and indexed",
    };
  }

  // Detect generic web URL
  const isWebUrl =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/\w\.\-\?\=\&\%#~]*)?$/i.test(
      trimmed,
    ) ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://");

  if (isWebUrl) {
    const normalized =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    return {
      type: "website",
      url: normalized,
      label: "Web Page",
      hint: "Article content will be crawled, cleaned, and indexed",
    };
  }

  return null;
}

export interface ImportSourceDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful import, e.g. to clear active filters. */
  onImported?: () => void;
}

/**
 * Unified, single dialog box for importing workspace sources.
 * Replaces older tabbed and multiple fragmented dialogs with an
 * all-in-one drag & drop zone, smart URL detection (YouTube vs. Web),
 * and collapsible quick notes.
 */
export function ImportSourceDialog({
  workspaceId,
  open,
  onOpenChange,
  onImported,
}: ImportSourceDialogProps) {
  const { push } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mutations
  const importPdf = useImportPdfSource(workspaceId);
  const importWebsite = useImportWebsiteSource(workspaceId);
  const importYoutube = useImportYoutubeSource(workspaceId);
  const importText = useImportTextSource(workspaceId);

  // Staged File State
  const [stagedFile, setStagedFile] = React.useState<File | null>(null);
  const [fileTitle, setFileTitle] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Link Ingestion State
  const [linkInput, setLinkInput] = React.useState("");
  const [linkTitle, setLinkTitle] = React.useState("");

  // Collapsible Note State
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteContent, setNoteContent] = React.useState("");
  const [noteFormat, setNoteFormat] = React.useState<"TEXT" | "MARKDOWN">("TEXT");

  // Reset form state whenever modal closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStagedFile(null);
      setFileTitle("");
      setFileError(null);
      setLinkInput("");
      setLinkTitle("");
      setNoteOpen(false);
      setNoteTitle("");
      setNoteContent("");
      setIsDragOver(false);
    }
    onOpenChange(nextOpen);
  };

  const closeAndComplete = () => {
    handleOpenChange(false);
    onImported?.();
  };

  // Validate and stage file
  const stageCandidateFile = React.useCallback((candidate: File) => {
    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setStagedFile(null);
      setFileError("Only PDF documents are supported for file upload.");
      return;
    }
    if (candidate.size > MAX_PDF_BYTES) {
      setStagedFile(null);
      setFileError("PDF file size must be under 20 MB.");
      return;
    }

    setFileError(null);
    setStagedFile(candidate);
  }, []);

  // Global clipboard paste listener while dialog is open
  React.useEffect(() => {
    if (!open) return;

    function handlePaste(e: ClipboardEvent) {
      const activeElement = document.activeElement;
      // Do not intercept if user is typing inside an input/textarea
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        stageCandidateFile(files[0]);
        return;
      }

      const pastedText = e.clipboardData?.getData("text")?.trim();
      if (
        pastedText &&
        (pastedText.startsWith("http") ||
          pastedText.includes("youtube") ||
          pastedText.includes("youtu.be"))
      ) {
        setLinkInput(pastedText);
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, stageCandidateFile]);

  // Detected link type
  const urlClassification = React.useMemo(
    () => detectUrlType(linkInput),
    [linkInput],
  );

  // Submit Handlers
  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagedFile) return;

    push({
      title: "PDF added",
      description: "Flux is reading and indexing the document now.",
    });

    submitInBackground(
      importPdf,
      { file: stagedFile, title: fileTitle.trim() || undefined },
      push,
      "Could not add PDF",
      closeAndComplete,
    );
  };

  const handleImportLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlClassification) return;

    if (urlClassification.type === "youtube") {
      push({
        title: "Video added",
        description: "Flux is importing the video transcript.",
      });
      submitInBackground(
        importYoutube,
        {
          url: urlClassification.url,
          title: linkTitle.trim() || undefined,
        },
        push,
        "Could not add video",
        closeAndComplete,
      );
    } else {
      push({
        title: "Website added",
        description: "Flux is crawling and extracting the webpage.",
      });
      submitInBackground(
        importWebsite,
        {
          url: urlClassification.url,
          title: linkTitle.trim() || undefined,
        },
        push,
        "Could not add website",
        closeAndComplete,
      );
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    push({
      title: "Note added",
      description: "Note saved and queued for workspace indexing.",
    });

    submitInBackground(
      importText,
      {
        title: noteTitle.trim(),
        content: noteContent,
        type: noteFormat,
      },
      push,
      "Could not add note",
      closeAndComplete,
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-border/70 bg-card rounded-2xl shadow-2xl duration-0 data-[state=open]:duration-0 data-[state=closed]:duration-0 animate-none data-[state=open]:animate-none data-[state=closed]:animate-none">
        {/* Header with bespoke title */}
        <div className="border-b border-border/50 px-5 py-4 bg-muted/15">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
              <HugeiconsIcon icon={FileUploadIcon} strokeWidth={1.5} className="size-5.5 text-primary shrink-0" />
              <span>Add Sources to Workspace</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add sources to workspace
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* 1. Drag & Drop Hero Box */}
          <div>
            <div
              role="region"
              aria-label="File dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  stageCandidateFile(file);
                  return;
                }
                // Check if user dropped a URL text
                const droppedText = e.dataTransfer.getData("text")?.trim();
                if (
                  droppedText &&
                  (droppedText.startsWith("http") || droppedText.includes("youtu"))
                ) {
                  setLinkInput(droppedText);
                }
              }}
              className={cn(
                "relative overflow-hidden rounded-2xl border-2 border-dashed",
                isDragOver
                  ? "border-primary bg-primary/10 ring-4 ring-primary/15"
                  : stagedFile
                    ? "border-primary/40 bg-primary/[0.02]"
                    : "border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 cursor-pointer",
              )}
              onClick={() => {
                if (!stagedFile) fileInputRef.current?.click();
              }}
            >
              {stagedFile ? (
                /* Staged File Card */
                <form
                  onSubmit={handleUploadFile}
                  className="p-4 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <HugeiconsIcon
                        icon={Pdf01Icon}
                        strokeWidth={1.5}
                        className="size-8 text-red-600 dark:text-red-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate max-w-[260px] sm:max-w-[320px]">
                          {stagedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {(stagedFile.size / (1024 * 1024)).toFixed(1)} MB • Ready
                          to upload
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStagedFile(null);
                        setFileTitle("");
                        setFileError(null);
                      }}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                      title="Remove file"
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Input
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="Title (optional, defaults to filename)"
                      maxLength={200}
                      className="h-8 text-xs bg-background/80"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Choose different
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={importPdf.isPending}
                      className="h-8 px-4 text-xs font-medium gap-1.5 shadow-xs"
                    >
                      <span>Upload & Index PDF</span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    </Button>
                  </div>
                </form>
              ) : (
                /* Empty Dropzone State */
                <div className="p-6 sm:p-7 text-center flex flex-col items-center justify-center gap-2.5">
                  <HugeiconsIcon
                    icon={FileUploadIcon}
                    strokeWidth={1.5}
                    className="size-10 text-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-foreground">
                      Drag & drop your PDF here, or{" "}
                      <span className="text-primary underline underline-offset-4 decoration-primary/40 group-hover:decoration-primary">
                        browse files
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground/75 mt-0.5">
                      PDF documents up to 20 MB
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label="Upload PDF document"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) stageCandidateFile(picked);
                  e.target.value = "";
                }}
              />
            </div>

            {fileError && (
              <p
                role="alert"
                className="text-destructive text-xs mt-1.5 px-1 font-medium"
              >
                {fileError}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <span className="relative bg-card px-2.5 text-[11px] font-medium tracking-wider uppercase text-muted-foreground/60">
              or paste a link
            </span>
          </div>

          {/* 2. Smart Link Input Box (Web & YouTube) */}
          <form onSubmit={handleImportLink} className="space-y-2">
            <div
              className={cn(
                "relative rounded-xl border bg-muted/20 p-1.5",
                urlClassification?.type === "youtube"
                  ? "border-red-500/40 bg-red-500/[0.03] focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10"
                  : urlClassification?.type === "website"
                    ? "border-primary/40 bg-primary/[0.03] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
                    : "border-border/70 hover:border-border/90 focus-within:border-primary/50 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10",
              )}
            >
              <div className="flex items-center gap-2">
                {/* Dynamic Icon Prefix */}
                <div className="flex size-7 shrink-0 items-center justify-center">
                  {urlClassification?.type === "youtube" ? (
                    <HugeiconsIcon
                      icon={YoutubeIcon}
                      strokeWidth={1.5}
                      className="size-5.5 text-red-600 dark:text-red-400"
                    />
                  ) : urlClassification?.type === "website" ? (
                    <HugeiconsIcon
                      icon={InternetIcon}
                      strokeWidth={1.5}
                      className="size-5.5 text-primary"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Link01Icon}
                      strokeWidth={1.5}
                      className="size-5 text-muted-foreground/60"
                    />
                  )}
                </div>

                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Paste YouTube video or webpage URL..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
                />

                {linkInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkInput("");
                      setLinkTitle("");
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                    title="Clear link"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </button>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={!urlClassification}
                  className={cn(
                    "h-7 px-3 rounded-lg text-xs font-medium shrink-0 gap-1 shadow-none",
                    urlClassification?.type === "youtube"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : urlClassification?.type === "website"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  <span>
                    {urlClassification?.type === "youtube"
                      ? "Import Video"
                      : urlClassification?.type === "website"
                        ? "Import Webpage"
                        : "Add Link"}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                </Button>
              </div>

              {/* Dynamic Status Pill */}
              {urlClassification && (
                <div className="flex items-center gap-2 pt-1 px-1 text-[11px]">
                  <span
                    className={cn(
                      "font-semibold px-1.5 py-0.5 rounded-md text-[10px] tracking-tight",
                      urlClassification.type === "youtube"
                        ? "bg-red-500/15 text-red-700 dark:text-red-300"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {urlClassification.label}
                  </span>
                  <span className="text-muted-foreground/80 truncate">
                    {urlClassification.hint}
                  </span>
                </div>
              )}
            </div>

            {/* Optional Title for Link */}
            {urlClassification && (
              <div className="pt-0.5">
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Custom title (optional, defaults to page/video title)"
                  className="h-8 text-xs bg-muted/20 border-border/60"
                  maxLength={200}
                />
              </div>
            )}
          </form>

          {/* 3. Collapsible Plain Text Note / Raw Excerpt */}
          <div className="pt-1">
            {!noteOpen ? (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border border-transparent hover:border-border/40 hover:bg-muted/20"
              >
                <HugeiconsIcon
                  icon={NoteIcon}
                  strokeWidth={1.5}
                  className="size-4.5 text-primary"
                />
                <span>Need to write a note or paste plain text?</span>
              </button>
            ) : (
              <form
                onSubmit={handleSaveNote}
                className="rounded-xl border border-border/70 bg-muted/15 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <HugeiconsIcon
                      icon={NoteIcon}
                      strokeWidth={1.5}
                      className="size-4.5 text-primary"
                    />
                    <span>Plain Text Note</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoteOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-[11px] hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title (e.g. Meeting takeaways, Chapter summary)"
                  required
                  className="h-8 text-xs bg-background/90"
                  maxLength={200}
                />

                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type or paste markdown/text content..."
                  rows={4}
                  required
                  className="text-xs bg-background/90 resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="note-format"
                        value="TEXT"
                        checked={noteFormat === "TEXT"}
                        onChange={() => setNoteFormat("TEXT")}
                        className="size-3.5 accent-primary"
                      />
                      Plain text
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="note-format"
                        value="MARKDOWN"
                        checked={noteFormat === "MARKDOWN"}
                        onChange={() => setNoteFormat("MARKDOWN")}
                        className="size-3.5 accent-primary"
                      />
                      Markdown
                    </label>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!noteTitle.trim() || !noteContent.trim()}
                    className="h-7.5 px-3 text-xs font-medium"
                  >
                    Save Note
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
