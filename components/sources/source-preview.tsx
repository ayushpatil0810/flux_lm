"use client";

import * as React from "react";
import { CloseIcon as X, ExternalLinkIcon as ExternalLink, FileIcon as FileText } from "@/components/ui/icons";
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
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-3.5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium leading-tight text-foreground">
              {source.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>{SOURCE_TYPE_LABELS[source.type]}</span>
              {source.type !== "PDF" && source.url && (
                <>
                  <span>·</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-0.5 truncate transition-colors hover:text-foreground"
                    title={source.url}
                  >
                    <span>{displayUrl(source.url)}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {source.type === "PDF" && source.url ? (
          <iframe
            src={source.url}
            title={source.title}
            className="h-full w-full border-0"
          />
        ) : source.type === "YOUTUBE" && source.url ? (
          <div className="flex h-full w-full items-center justify-center p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-5xl aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
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
            <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:leading-relaxed prose-pre:rounded-lg prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/50">
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
