import type { Source, SourceStatus, SourceType } from "@/lib/api";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  PDF: "PDF",
  WEBSITE: "Website",
  YOUTUBE: "YouTube",
  TEXT: "Text",
  MARKDOWN: "Markdown",
};

export interface SourceTypeStyle {
  iconBg: string;
  iconColor: string;
  iconBorder: string;
}

export const SOURCE_TYPE_STYLES: Record<SourceType, SourceTypeStyle> = {
  PDF: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBorder: "border-rose-500/20",
  },
  WEBSITE: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBorder: "border-blue-500/20",
  },
  YOUTUBE: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBorder: "border-rose-500/20",
  },
  TEXT: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBorder: "border-amber-500/20",
  },
  MARKDOWN: {
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-600 dark:text-slate-400",
    iconBorder: "border-slate-500/20",
  },
};

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  PENDING: "Queued",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
};

/** Strips protocol and trailing slash for compact URL display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Secondary line under a source title: link target or original filename. */
export function sourceSubtitle(source: Source): string | null {
  if (source.url) return displayUrl(source.url);
  const filename = source.metadata?.originalFilename;
  if (typeof filename === "string" && filename.length > 0) return filename;
  return null;
}
