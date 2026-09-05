"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { CitationMetadata, Message } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface StreamState {
  userText: string;
  assistantText: string;
}

export interface StreamError {
  userText: string;
  message: string;
}

interface MessageListProps {
  messages: Message[];
  stream: StreamState | null;
  streamError: StreamError | null;
  onRetry: (text: string) => void;
  onOpenSource?: (sourceId: string) => void;
}

/**
 * Conversation transcript: user messages as blue bubbles on the right,
 * assistant replies as plain full-width markdown on the left — no role
 * labels, no cards, nothing between the user and the answer.
 */
export function MessageList({
  messages,
  stream,
  streamError,
  onRetry,
  onOpenSource,
}: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pinnedToBottom = React.useRef(true);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, stream?.assistantText, streamError]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-5 px-3 sm:px-6 md:px-8 pt-2 sm:pt-3 pb-2">
        {messages.map((message) => (
          <TranscriptMessage
            key={message.id}
            role={message.role}
            content={message.content}
            citations={message.citations}
            onOpenSource={onOpenSource}
          />
        ))}
        {stream ? (
          <>
            <TranscriptMessage role="USER" content={stream.userText} />
            <TranscriptMessage
              role="ASSISTANT"
              content={stream.assistantText}
              streaming
            />
          </>
        ) : null}
        {streamError ? (
          <>
            <TranscriptMessage role="USER" content={streamError.userText} />
            <div
              role="alert"
              className="border-destructive/40 rounded-lg border px-4 py-3"
            >
              <p className="text-sm font-medium">The reply failed</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {streamError.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onRetry(streamError.userText)}
              >
                Try again
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

interface TranscriptMessageProps {
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: CitationMetadata[] | null;
  streaming?: boolean;
  onOpenSource?: (sourceId: string) => void;
}

function TranscriptMessage({
  role,
  content,
  citations,
  streaming,
  onOpenSource,
}: TranscriptMessageProps) {
  const isUser = role === "USER";

  if (isUser) {
    return (
      <article className="animate-in fade-in flex w-full justify-end duration-200">
        <div className="bg-primary text-primary-foreground max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 text-sm leading-relaxed">
          <p className="break-words whitespace-pre-wrap">{content}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="animate-in fade-in w-full duration-200">
      {content ? (
        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:rounded-lg prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted/50 max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {streaming && (
            <span
              aria-hidden
              className="border-primary ml-1.5 inline-block size-3.5 animate-spin rounded-full border-2 border-t-transparent align-middle"
            />
          )}
        </div>
      ) : streaming ? (
        <div className="flex items-center gap-1.5 py-2">
          <span
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      ) : null}

      {citations && citations.length > 0 ? (
        <CitationList citations={citations} onOpenSource={onOpenSource} />
      ) : null}
    </article>
  );
}

function CitationList({
  citations,
  onOpenSource,
}: {
  citations: CitationMetadata[];
  onOpenSource?: (sourceId: string) => void;
}) {
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return citations.filter((citation) => {
      const key = `${citation.sourceId}:${citation.page ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [citations]);

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {unique.map((citation, i) => (
        <div key={citation.chunkId} className="group relative">
          <button
            type="button"
            onClick={() => onOpenSource?.(citation.sourceId)}
            className="border-border/60 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            title="Click to preview source"
          >
            <HugeiconsIcon
              icon={BookOpen01Icon}
              strokeWidth={1.5}
              className="size-3 text-primary"
              aria-hidden
            />
            <span className="text-primary font-medium">{i + 1}</span>
            <span className="max-w-[160px] truncate">
              {citation.sourceTitle}
            </span>
          </button>

          <div className="border-border/60 bg-popover text-popover-foreground animate-in fade-in slide-in-from-bottom-1 pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-72 max-w-[calc(100vw-2rem)] rounded-xl border p-3 shadow-xl backdrop-blur-md md:group-hover:block">
            <div className="border-border/60 flex items-center gap-2 border-b pb-2">
              <HugeiconsIcon
                icon={File01Icon}
                strokeWidth={1.5}
                className="text-primary size-3.5"
                aria-hidden
              />
              <p className="truncate text-xs font-medium">
                {citation.sourceTitle}
              </p>
              {citation.page ? (
                <span className="bg-muted text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                  pg {citation.page}
                </span>
              ) : null}
            </div>
            {citation.excerpt && (
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed font-inter font-normal">
                &ldquo;{citation.excerpt}&rdquo;
              </p>
            )}
            <p className="text-primary/80 mt-2 text-[10px] font-medium">
              Click to view source in preview →
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
