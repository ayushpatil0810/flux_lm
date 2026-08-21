import type { Source, SourceStatus, SourceType } from "@/lib/api";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  PDF: "PDF",
  WEBSITE: "Website",
  YOUTUBE: "YouTube",
  TEXT: "Text",
  MARKDOWN: "Markdown",
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
