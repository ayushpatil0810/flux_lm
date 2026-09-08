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
  FileEditIcon,
  FileSpreadsheetIcon,
  PresentationBarChart01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

import {
  useImportWebsiteSource,
  useImportYoutubeSource,
  useImportTextSource,
  useImportFileSource,
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

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

// Allowed extensions and their display metadata
type FileExtension = "pdf" | "txt" | "md" | "docx" | "pptx" | "xlsx";

interface FileTypeInfo {
  label: string;
  mime: string;
  icon: React.FC<{ className?: string }>;
  iconClass: string;
}

const FILE_TYPE_MAP: Record<FileExtension, FileTypeInfo> = {
  pdf: {
    label: "PDF",
    mime: "application/pdf",
    icon: (props) => (
      <HugeiconsIcon icon={Pdf01Icon} strokeWidth={1.5} {...props} />
    ),
    iconClass: "text-red-500",
  },
  docx: {
    label: "Word Document",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: (props) => (
      <HugeiconsIcon icon={FileEditIcon} strokeWidth={1.5} {...props} />
    ),
    iconClass: "text-blue-500",
  },
  xlsx: {
    label: "Excel Spreadsheet",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    icon: (props) => (
      <HugeiconsIcon icon={FileSpreadsheetIcon} strokeWidth={1.5} {...props} />
    ),
    iconClass: "text-emerald-500",
  },
  pptx: {
    label: "PowerPoint Presentation",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    icon: (props) => (
      <HugeiconsIcon
        icon={PresentationBarChart01Icon}
        strokeWidth={1.5}
        {...props}
      />
    ),
    iconClass: "text-amber-500",
  },
  md: {
    label: "Markdown",
    mime: "text/markdown",
    icon: (props) => (
      <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} {...props} />
    ),
    iconClass: "text-purple-500",
  },
  txt: {
    label: "Plain Text",
    mime: "text/plain",
    icon: (props) => (
      <HugeiconsIcon icon={NoteIcon} strokeWidth={1.5} {...props} />
    ),
    iconClass: "text-slate-400",
  },
};

const FORMAT_ICONS = [
  { icon: Pdf01Icon, label: "PDF", cls: "text-red-500/80" },
  { icon: FileEditIcon, label: "Word", cls: "text-blue-500/80" },
  { icon: FileSpreadsheetIcon, label: "Excel", cls: "text-emerald-500/80" },
  {
    icon: PresentationBarChart01Icon,
    label: "PowerPoint",
    cls: "text-amber-500/80",
  },
  { icon: File01Icon, label: "Markdown", cls: "text-purple-500/80" },
  { icon: NoteIcon, label: "Text", cls: "text-slate-400" },
];

const ACCEPT_STRING =
  Object.values(FILE_TYPE_MAP)
    .map((t) => t.mime)
    .join(",") + ",.pdf,.txt,.md,.docx,.pptx,.xlsx";

function getFileExtension(filename: string): FileExtension | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return (ext as FileExtension) in FILE_TYPE_MAP
    ? (ext as FileExtension)
    : null;
}

function getFileTypeInfo(filename: string): FileTypeInfo | null {
  const ext = getFileExtension(filename);
  return ext ? FILE_TYPE_MAP[ext] : null;
}

type UrlClassification =
  | { type: "youtube"; url: string }
  | { type: "website"; url: string }
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

export function ImportSourceDialog({
  workspaceId,
  open,
  onOpenChange,
  onImported,
}: ImportSourceDialogProps) {
  const { push } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mutations
  const importFile = useImportFileSource(workspaceId);
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
  const [noteFormat, setNoteFormat] = React.useState<"TEXT" | "MARKDOWN">(
    "TEXT",
  );

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
    const ext = getFileExtension(candidate.name);
    if (!ext) {
      setStagedFile(null);
      setFileError(
        "Unsupported file type. Supported: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Markdown (.md), plain text (.txt).",
      );
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setStagedFile(null);
      setFileError("File size must be under 50 MB.");
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

  // Derive file info for staged file
  const stagedFileInfo = stagedFile ? getFileTypeInfo(stagedFile.name) : null;
  const stagedFileExt = stagedFile ? getFileExtension(stagedFile.name) : null;
  const isUploading = importFile.isPending;

  // Submit Handlers
  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagedFile || !stagedFileExt) return;

    const titleStr = fileTitle.trim() || undefined;
    const info = FILE_TYPE_MAP[stagedFileExt] ?? { label: "Document" };

    push({
      title: `${info.label} added`,
      description: "Flux is processing the document.",
    });

    submitInBackground(
      importFile,
      { file: stagedFile, title: titleStr, extension: stagedFileExt },
      push,
      `Could not add ${info.label}`,
      closeAndComplete,
    );
  };

  const handleImportLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlClassification) return;

    if (urlClassification.type === "youtube") {
      push({
        title: "Video added",
        description: "Flux is loading the video transcript.",
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
        description: "Flux is loading the webpage.",
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
      description: "Note saved to your workspace.",
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
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        {/* Header — pinned, matches Flux standard modal header */}
        <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left">
          <DialogTitle className="text-heading font-serif">
            Add sources
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a file, link, or text note to this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 1. File Upload Dropzone or Staged File */}
          {stagedFile && stagedFileInfo ? (
            <form onSubmit={handleUploadFile} className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/15 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <stagedFileInfo.icon
                    className={cn("size-6 shrink-0", stagedFileInfo.iconClass)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {stagedFile.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {stagedFileInfo.label} ·{" "}
                      {(stagedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setStagedFile(null);
                    setFileTitle("");
                    setFileError(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Remove file"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </Button>
              </div>

              <Input
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="Title (optional)"
                maxLength={200}
                className="h-8 text-xs"
              />

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Change file
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading}
                  className="h-7.5 text-xs"
                >
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${stagedFileInfo.label}`}
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <div
                role="region"
                aria-label="File dropzone"
                onClick={() => fileInputRef.current?.click()}
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
                  const droppedText = e.dataTransfer
                    .getData("text")
                    ?.trim();
                  if (
                    droppedText &&
                    (droppedText.startsWith("http") ||
                      droppedText.includes("youtu"))
                  ) {
                    setLinkInput(droppedText);
                  }
                }}
                className={cn(
                  "group flex flex-col items-center justify-center rounded-xl border border-dashed py-8 px-4 text-center transition-colors cursor-pointer",
                  isDragOver
                    ? "border-foreground/40 bg-muted/20"
                    : "border-border/60 hover:border-foreground/30 bg-muted/5 hover:bg-muted/15",
                )}
              >
                <HugeiconsIcon
                  icon={FileUploadIcon}
                  strokeWidth={1.5}
                  className="size-6 text-muted-foreground/60 transition-colors group-hover:text-foreground mb-2"
                />
                <p className="text-xs font-medium text-foreground">
                  Drop file to upload, or{" "}
                  <span className="text-primary hover:underline">browse</span>
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Up to 50 MB
                </p>

                {/* Format icons */}
                <div className="flex items-center justify-center gap-3.5 mt-3.5 text-muted-foreground/70">
                  {FORMAT_ICONS.map(({ icon, label, cls }) => (
                    <div
                      key={label}
                      title={label}
                      className="transition-transform hover:scale-110"
                    >
                      <HugeiconsIcon
                        icon={icon}
                        strokeWidth={1.5}
                        className={cn("size-5.5", cls)}
                      />
                    </div>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  className="sr-only"
                  aria-label="Upload document"
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
          )}

          {/* 2. Link Input (Web or YouTube) */}
          <form onSubmit={handleImportLink} className="space-y-2">
            <div className="relative flex items-center">
              <HugeiconsIcon
                icon={
                  urlClassification?.type === "youtube"
                    ? YoutubeIcon
                    : urlClassification?.type === "website"
                      ? InternetIcon
                      : Link01Icon
                }
                strokeWidth={1.5}
                className={cn(
                  "size-4 absolute left-3 pointer-events-none transition-colors",
                  urlClassification?.type === "youtube"
                    ? "text-red-500"
                    : urlClassification?.type === "website"
                      ? "text-primary"
                      : "text-muted-foreground/50",
                )}
              />
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste a link (webpage or YouTube)..."
                className="h-8.5 pl-9 pr-18 text-xs bg-muted/10 border-border/60 focus-visible:bg-background"
              />
              {linkInput.trim() && (
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkInput("");
                      setLinkTitle("");
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                    title="Clear"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      className="size-3"
                    />
                  </button>
                  <Button
                    type="submit"
                    size="xs"
                    disabled={!urlClassification}
                    className="h-6 text-[11px] px-2.5"
                  >
                    Import
                  </Button>
                </div>
              )}
            </div>

            {urlClassification && (
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Custom title (optional)"
                maxLength={200}
                className="h-8 text-xs"
              />
            )}
          </form>

          {/* 3. Text Note / Excerpt */}
          {!noteOpen ? (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1.5 py-1"
              >
                <HugeiconsIcon
                  icon={NoteIcon}
                  strokeWidth={1.5}
                  className="size-3.5"
                />
                <span>Or paste raw text</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveNote}
              className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Raw text note
                </span>
                <button
                  type="button"
                  onClick={() => setNoteOpen(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title"
                required
                maxLength={200}
                className="h-8 text-xs"
              />

              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type or paste markdown/text content..."
                rows={4}
                required
                className="text-xs resize-none font-mono"
              />

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNoteFormat("TEXT")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-colors",
                      noteFormat === "TEXT"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteFormat("MARKDOWN")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-colors",
                      noteFormat === "MARKDOWN"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Markdown
                  </button>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!noteTitle.trim() || !noteContent.trim()}
                  className="h-7.5 text-xs px-3"
                >
                  Save Note
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
