"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  ApiClientError,
  apiFetch,
  endpoints,
  getErrorMessage,
  queryKeys,
  shouldRetry,
  streamWorkspaceChat,
  type ChatModel,
  type ChatRequestMessage,
  type Message,
} from "@/lib/api";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useConversations, useMessages } from "@/hooks/use-conversations";
import { useSources } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileUploadIcon } from "@hugeicons/core-free-icons";
import {
  useWorkspacePanel,
  useWorkspacePreview,
} from "@/components/shell/workspace-panel-context";
import { ErrorState, LoadingState } from "@/components/shell/states";
import { ChatSkeleton } from "./chat-skeleton";
import { Composer } from "./composer";
import {
  MessageList,
  type StreamError,
  type StreamState,
} from "./message-list";

interface ChatViewProps {
  workspaceId: string;
}

/**
 * The unified chat area for the workspace.
 * It uses the first available conversation for the workspace,
 * or starts a new one if none exists.
 */
export function ChatView({ workspaceId }: ChatViewProps) {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { setLeftOpen } = useWorkspacePanel();
  const { setPreviewSource } = useWorkspacePreview();

  const { data: workspace } = useWorkspaceContext();
  const { data: conversations, isPending: isConversationsPending } =
    useConversations(workspaceId);
  const { data: sources } = useSources(workspaceId);

  const sourcesCount = sources?.length ?? 0;
  const noSources = sources !== undefined && sources.length === 0;

  // Use the first conversation available in the workspace, or undefined if none.
  const activeConversationId =
    conversations && conversations.length > 0 ? conversations[0].id : undefined;

  const messagesQuery = useMessages(activeConversationId);

  const [model, setModel] = React.useState<ChatModel | null>(null);
  const [webSearch, setWebSearch] = React.useState(false);
  const [stream, setStream] = React.useState<StreamState | null>(null);
  const [streamError, setStreamError] = React.useState<StreamError | null>(
    null,
  );
  const abortRef = React.useRef<AbortController | null>(null);

  /**
   * Once the user sends their first message, keep the MessageList mounted
   * even while transient query states (conversations list, messages) are
   * resolving. This prevents the welcome screen from flashing back after
   * the stream finishes and the new conversation ID is briefly unknown.
   */
  const hasEverStreamedRef = React.useRef(false);

  /**
   * Keep a copy of the last stream so we can continue showing the optimistic
   * user + assistant messages while the persisted messages are being fetched
   * after the stream completes. This prevents the brief loading-spinner flash
   * that would otherwise appear when the conversation ID changes on first send.
   */
  const lastStreamRef = React.useRef<StreamState | null>(null);

  const effectiveModel: ChatModel =
    model ?? (workspace?.defaultModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini");

  // Reset transient stream state when moving between conversations (if it ever happens).
  const [prevConversationId, setPrevConversationId] =
    React.useState(activeConversationId);
  if (activeConversationId !== prevConversationId) {
    setPrevConversationId(activeConversationId);
    // Only wipe the last stream once the new conversation's messages are loaded,
    // so we never show a spinner between "stream done" and "messages fetched".
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      lastStreamRef.current = null;
    }
    setStream(null);
    setStreamError(null);
    // Reset the "ever streamed" guard when moving workspaces.
    hasEverStreamedRef.current = false;
  }

  // Clear the lastStream once the real messages are available.
  React.useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      lastStreamRef.current = null;
    }
  }, [messagesQuery.data]);

  // Abort any in-flight stream when switching conversations or unmounting.
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [activeConversationId]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || stream) return;

    hasEverStreamedRef.current = true;
    setStreamError(null);
    const newStream: StreamState = { userText: content, assistantText: "" };
    setStream(newStream);
    lastStreamRef.current = newStream;

    const history: ChatRequestMessage[] = (messagesQuery.data ?? []).map(
      toRequestMessage,
    );
    history.push({ role: "user", parts: [{ type: "text", text: content }] });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { conversationId: returnedId } = await streamWorkspaceChat(
        workspaceId,
        {
          conversationId: activeConversationId,
          messages: history,
          model: effectiveModel,
          webSearch,
        },
        {
          signal: controller.signal,
          onChunk: (chunk) =>
            setStream((current) => {
              if (!current) return current;
              const updated = {
                ...current,
                assistantText: current.assistantText + chunk,
              };
              lastStreamRef.current = updated;
              return updated;
            }),
        },
      );

      // Keep `stream` set while we fetch the persisted messages so the
      // optimistic messages stay visible — no loading-spinner flash.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(workspaceId),
      });
      if (returnedId) {
        await queryClient.fetchQuery({
          queryKey: queryKeys.conversations.messages(returnedId),
          queryFn: () =>
            apiFetch<Message[]>(endpoints.conversations.messages(returnedId)),
          retry: shouldRetry,
        });
      }
      // Clear the live stream. lastStreamRef stays alive until the effect above
      // sees messages.data populated, preventing the flash.
      setStream(null);
    } catch (error) {
      if (controller.signal.aborted) {
        // The user stopped the reply. Resync in case anything persisted.
        await queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all(workspaceId),
        });
        if (activeConversationId) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.conversations.messages(activeConversationId),
          });
        }
        lastStreamRef.current = null;
        setStream(null);
        return;
      }
      lastStreamRef.current = null;
      setStream(null);
      const message = getErrorMessage(error);
      setStreamError({ userText: content, message });
      if (error instanceof ApiClientError && error.isRateLimited) {
        push({
          variant: "destructive",
          title: "Rate limit reached",
          description: message,
        });
      }
    }
  }

  function retry(text: string) {
    setStreamError(null);
    void send(text);
  }

  if (isConversationsPending) {
    return <ChatSkeleton />;
  }

  return (
    <div className="bg-background flex h-full w-full overflow-hidden font-inter font-normal">
      <section
        aria-label="Conversation"
        className="bg-background flex min-w-0 flex-1 flex-col"
      >
        {hasEverStreamedRef.current ||
        activeConversationId ||
        stream ||
        streamError ||
        lastStreamRef.current ? (
          <>
            {activeConversationId &&
            messagesQuery.isPending &&
            !lastStreamRef.current ? (
              <LoadingState label="Loading conversation" />
            ) : activeConversationId && messagesQuery.isError ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-6">
                <ErrorState
                  title="Could not load this conversation"
                  message={getErrorMessage(messagesQuery.error)}
                  onRetry={() => messagesQuery.refetch()}
                />
              </div>
            ) : (
              <MessageList
                messages={messagesQuery.data ?? []}
                stream={
                  stream ??
                  (messagesQuery.isPending ? lastStreamRef.current : null)
                }
                streamError={streamError}
                onRetry={retry}
                onOpenSource={(sourceId) => {
                  const src = sources?.find((s) => s.id === sourceId);
                  if (src) setPreviewSource(src);
                }}
              />
            )}

            <Composer
              isStreaming={stream !== null}
              onSend={(text) => void send(text)}
              onStop={() => abortRef.current?.abort()}
              model={effectiveModel}
              onModelChange={setModel}
              webSearch={webSearch}
              onWebSearchChange={setWebSearch}
            />
          </>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 sm:p-12">
              <div className="animate-in fade-in flex w-full max-w-xl flex-col items-center text-center duration-300">
                <h1 className="text-foreground font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                  Ask {workspace?.title ?? "this workspace"}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed font-inter font-normal">
                  Answers grounded in your sources, with citations.
                  {sourcesCount > 0
                    ? ` ${sourcesCount} ${sourcesCount === 1 ? "source" : "sources"} connected.`
                    : ""}
                </p>

                {noSources ? (
                  <button
                    type="button"
                    onClick={() => setLeftOpen(true)}
                    className="group border-border/60 hover:border-primary/50 hover:bg-primary/5 mt-8 flex items-center gap-3.5 rounded-2xl border border-dashed p-4 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-primary/15">
                      <HugeiconsIcon
                        icon={FileUploadIcon}
                        strokeWidth={1.5}
                        className="size-5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        Add your first source →
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs font-inter font-normal">
                        Import a PDF, web page, YouTube video, or note
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      {
                        label: "Summarize key takeaways",
                        prompt:
                          "Summarize the key takeaways from the connected sources.",
                      },
                      {
                        label: "Extract main insights",
                        prompt:
                          "What are the main insights across all documents?",
                      },
                      {
                        label: "Find user feedback",
                        prompt: "Find mentions of user feedback and requests.",
                      },
                      {
                        label: "List action items",
                        prompt: "Extract key action items and next steps.",
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => void send(item.prompt)}
                        className="group border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60 focus-visible:ring-ring flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <span className="text-foreground text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          {item.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Composer
              isStreaming={stream !== null}
              onSend={(text) => void send(text)}
              onStop={() => abortRef.current?.abort()}
              model={effectiveModel}
              onModelChange={setModel}
              webSearch={webSearch}
              onWebSearchChange={setWebSearch}
              autoFocus
            />
          </>
        )}
      </section>
    </div>
  );
}

function toRequestMessage(message: Message): ChatRequestMessage {
  return {
    id: message.id,
    role: message.role.toLowerCase() as "user" | "assistant",
    parts: [{ type: "text", text: message.content }],
  };
}
