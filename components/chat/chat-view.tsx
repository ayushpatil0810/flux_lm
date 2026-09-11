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
import { CHAT_MODEL, CHAT_MODELS } from "@/lib/constants";
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
  const { setLeftOpen, setImportDialogOpen } = useWorkspacePanel();
  const { setPreviewSource } = useWorkspacePreview();

  const { data: workspace } = useWorkspaceContext();
  const { data: conversations, isPending: isConversationsPending } =
    useConversations(workspaceId);
  const { data: sources } = useSources(workspaceId);

  const noSources = sources !== undefined && sources.length === 0;

  const [selectedConversationId, setSelectedConversationId] = React.useState<
    string | undefined
  >(undefined);

  // Use selected conversation if set, otherwise first available in workspace
  const activeConversationId =
    selectedConversationId ??
    (conversations && conversations.length > 0 ? conversations[0].id : undefined);

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
   * even while transient query states are resolving.
   */
  const hasEverStreamedRef = React.useRef(false);

  /**
   * Keep a copy of the last stream so we can continue showing optimistic
   * messages while persisted messages are being fetched.
   */
  const lastStreamRef = React.useRef<StreamState | null>(null);

  const effectiveModel: ChatModel =
    model ??
    (CHAT_MODELS.find((m) => m === workspace?.defaultModel) ?? CHAT_MODEL);

  // Reset workspace-scoped transient state when switching workspaces
  React.useEffect(() => {
    setSelectedConversationId(undefined);
    setStream(null);
    setStreamError(null);
    lastStreamRef.current = null;
    hasEverStreamedRef.current = false;
  }, [workspaceId]);

  // Abort any in-flight stream when switching workspace or unmounting
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [workspaceId]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || stream) return;

    hasEverStreamedRef.current = true;
    setStreamError(null);
    const newStream: StreamState = {
      userText: content,
      assistantText: "",
      isStreaming: true,
    };
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
                isStreaming: true,
              };
              lastStreamRef.current = updated;
              return updated;
            }),
        },
      );

      const targetId = returnedId ?? activeConversationId;
      if (targetId) {
        setSelectedConversationId(targetId);
      }

      // Immediately mark isStreaming false so the spinner stops as soon as generation completes
      setStream((current) =>
        current ? { ...current, isStreaming: false } : null,
      );

      // Fetch persisted messages from the database
      if (targetId) {
        try {
          const persistedMessages = await apiFetch<Message[]>(
            endpoints.conversations.messages(targetId),
          );
          queryClient.setQueryData(
            queryKeys.conversations.messages(targetId),
            persistedMessages,
          );
        } catch {
          // If network fetch fails, keep optimistic messages in query cache so they never disappear
          const fallbackMessages: Message[] = [
            ...(messagesQuery.data ?? []),
            {
              id: `opt-user-${Date.now()}`,
              conversationId: targetId,
              role: "USER",
              content,
              citations: null,
              createdAt: new Date().toISOString(),
            },
            {
              id: `opt-asst-${Date.now()}`,
              conversationId: targetId,
              role: "ASSISTANT",
              content: lastStreamRef.current?.assistantText ?? "",
              citations: null,
              createdAt: new Date().toISOString(),
            },
          ];
          queryClient.setQueryData(
            queryKeys.conversations.messages(targetId),
            fallbackMessages,
          );
        }
      }

      // Revalidate conversations list so workspace sidebar/header updates
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(workspaceId),
      });

      // Clear stream now that messages are committed to the cache
      setStream(null);
      lastStreamRef.current = null;
    } catch (error) {
      const returnedId =
        (error as { conversationId?: string | null })?.conversationId ??
        activeConversationId;
      if (returnedId) {
        setSelectedConversationId(returnedId);
      }

      if (controller.signal.aborted) {
        // The user stopped the reply. Resync in case anything persisted.
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all(workspaceId),
        });
        if (returnedId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.conversations.messages(returnedId),
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
    <div className="bg-card flex h-full w-full min-h-0 flex-col overflow-hidden font-inter font-normal">
      {/* Unified Card Header */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/50 px-4 bg-card">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Chat
          </h2>
        </div>
      </div>

      <section
        aria-label="Conversation"
        className="bg-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        {hasEverStreamedRef.current ||
        activeConversationId ||
        stream ||
        streamError ||
        lastStreamRef.current ? (
          <>
            {activeConversationId &&
            messagesQuery.isPending &&
            !stream &&
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
            <div className="flex min-h-0 flex-1 flex-col items-center px-3 sm:px-8 pt-3 sm:pt-4 pb-2 overflow-y-auto">
              <div className="animate-in fade-in my-auto flex w-full max-w-xl flex-col items-center text-center duration-300">
                <h1 className="text-foreground font-heading text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                  Ask {workspace?.title ?? "this workspace"}
                </h1>

                {noSources ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImportDialogOpen(true);
                      setLeftOpen(true);
                    }}
                    className="group border-border/80 hover:border-border hover:bg-muted/30 mt-5 sm:mt-8 flex items-center gap-3.5 rounded-2xl border border-dashed p-3.5 sm:p-4 text-left transition-colors duration-200 cursor-pointer shadow-2xs"
                  >
                    <HugeiconsIcon
                      icon={FileUploadIcon}
                      strokeWidth={1.5}
                      className="size-7 sm:size-8 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                        Add your first source →
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-xs font-inter font-normal">
                        Import a PDF, web page, YouTube video, or note
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="mt-5 sm:mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
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
                        className="group border-border/60 bg-card hover:border-border hover:bg-muted/30 focus-visible:ring-ring flex flex-col justify-between rounded-xl border p-2.5 sm:p-3.5 text-left transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <span className="text-foreground text-xs sm:text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1 text-[11px] sm:text-xs font-inter">
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
