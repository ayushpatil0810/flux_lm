"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/api";

interface DocxDocumentViewProps {
  source: Source;
}

/**
 * Strips potentially dangerous tags from HTML before rendering.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export function DocxDocumentView({ source }: DocxDocumentViewProps) {
  const docxHtml =
    typeof source.metadata?.docxHtml === "string"
      ? source.metadata.docxHtml
      : null;
  const content = source.content || "";

  const cleanHtml = React.useMemo(() => {
    if (!docxHtml) return null;
    return sanitizeHtml(docxHtml);
  }, [docxHtml]);

  return (
    <div className="p-3.5 sm:p-4">
      {cleanHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
          className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none font-sans leading-relaxed
            prose-headings:tracking-tight prose-headings:text-foreground
            prose-headings:font-semibold
            prose-h1:text-lg prose-h1:mt-5 prose-h1:mb-2.5
            prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
            prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5
            prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-3
            prose-ul:my-2.5 prose-ul:list-disc prose-ul:pl-5
            prose-ol:my-2.5 prose-ol:list-decimal prose-ol:pl-5
            prose-li:my-0.5 prose-li:text-foreground/90
            prose-table:my-3 prose-table:w-full prose-table:border-collapse prose-table:text-xs
            prose-th:border prose-th:border-border/60 prose-th:bg-muted/40 prose-th:p-2 prose-th:font-semibold
            prose-td:border prose-td:border-border/40 prose-td:p-2
            prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:italic"
        />
      ) : content ? (
        <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none font-sans leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          *No content available.*
        </p>
      )}
    </div>
  );
}
