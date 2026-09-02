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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        {messages.map((message) => (
          <TranscriptMessage
            key={message.id}
            role={message.role}
            content={message.content}
            citations={message.citations}
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
}

function TranscriptMessage({
  role,
  content,
  citations,
  streaming,
}: TranscriptMessageProps) {
  const isUser = role === "USER";

  if (isUser) {
    return (
      <article className="animate-in fade-in flex w-full justify-end duration-200">
        <div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
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
        <CitationList citations={citations} />
      ) : null}
    </article>
  );
}

function CitationList({ citations }: { citations: CitationMetadata[] }) {
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
        <div
          key={citation.chunkId}
          className="group relative cursor-default"
          tabIndex={0}
        >
          <div className="border-border/60 text-muted-foreground hover:border-border hover:text-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors">
            <HugeiconsIcon
              icon={BookOpen01Icon}
              strokeWidth={1.5}
              className="size-3"
              aria-hidden
            />
            <span className="text-primary font-medium">{i + 1}</span>
            <span className="max-w-[160px] truncate">
              {citation.sourceTitle}
            </span>
          </div>

          <div className="border-border/60 bg-popover text-popover-foreground animate-in fade-in slide-in-from-bottom-1 absolute bottom-full left-0 z-50 mb-2 hidden w-72 rounded-lg border p-3 shadow-lg group-hover:block group-focus:block group-active:block">
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
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                &ldquo;{citation.excerpt}&rdquo;
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
