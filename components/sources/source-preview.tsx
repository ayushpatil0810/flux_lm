"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  LinkSquare01Icon,
  File01Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Source } from "@/lib/api";
import { SOURCE_TYPE_LABELS, displayUrl } from "./source-meta";

interface SourcePreviewProps {
  source: Source;
  onClose: () => void;
}

function getYouTubeEmbedUrl(url: string) {
  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v") || "";
    }
  } catch {
    // ignore
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export function SourcePreview({ source, onClose }: SourcePreviewProps) {
  const [viewMode, setViewMode] = React.useState<"pdf" | "text">("pdf");
  const [isPdfLoading, setIsPdfLoading] = React.useState(true);
  const isPdf = source.type === "PDF";

  // Reset loading spinner whenever source or viewMode changes
  React.useEffect(() => {
    if (isPdf && viewMode === "pdf") {
      setIsPdfLoading(true);
    }
  }, [source.id, viewMode, isPdf]);

  return (
    <div className="bg-background flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="border-border/40 bg-background flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
            <HugeiconsIcon
              icon={File01Icon}
              strokeWidth={1.5}
              className="size-3.5"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate text-sm leading-tight font-semibold tracking-tight">
              {source.title}
            </h2>
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-normal font-inter">
              <span>{SOURCE_TYPE_LABELS[source.type]}</span>
              {source.type !== "PDF" && source.url && (
                <>
                  <span>·</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground flex items-center gap-0.5 truncate transition-colors"
                    title={source.url}
                  >
                    <span>{displayUrl(source.url)}</span>
                    <HugeiconsIcon
                      icon={LinkSquare01Icon}
                      strokeWidth={1.5}
                      className="size-2.5"
                    />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPdf && source.content ? (
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  viewMode === "pdf"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setViewMode("text")}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  viewMode === "text"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Text
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={1.5}
              className="size-3.5"
              aria-hidden
            />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {isPdf && viewMode === "pdf" ? (
          <div className="relative h-full w-full">
            {isPdfLoading ? (
              <div className="bg-background/90 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="size-6 animate-spin text-primary"
                />
                <p className="font-inter text-muted-foreground text-xs font-medium">
                  Loading PDF document…
                </p>
              </div>
            ) : null}
            <iframe
              src={`/api/sources/${source.id}/file`}
              title={source.title}
              onLoad={() => setIsPdfLoading(false)}
              className="h-full w-full border-0"
            />
          </div>
        ) : source.type === "YOUTUBE" && source.url ? (
          <div className="flex h-full w-full items-center justify-center p-4 md:p-6 lg:p-8">
            <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-lg">
              <iframe
                src={getYouTubeEmbedUrl(source.url)}
                title={source.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:rounded-lg prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/50 max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {source.content || "*No content extracted.*"}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
