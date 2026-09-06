import type { SourceType } from "@/lib/api";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  PDF: "PDF",
  WEBSITE: "Website",
  YOUTUBE: "YouTube",
  TEXT: "Text",
  MARKDOWN: "Markdown",
};

/** Strips protocol and trailing slash for compact URL display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

