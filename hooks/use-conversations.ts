import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  endpoints,
  queryKeys,
  shouldRetry,
  type Conversation,
  type Message,
} from "@/lib/api";

/** Lists a workspace's conversations, most recently active first. */
export function useConversations(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.conversations.all(workspaceId),
    queryFn: () =>
      apiFetch<Conversation[]>(endpoints.conversations.list(workspaceId)),
    staleTime: 30 * 1000, // 30 seconds
    retry: shouldRetry,
  });
}

/** Fetches a conversation's messages in chronological order. */
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.messages(conversationId ?? ""),
    queryFn: () =>
      apiFetch<Message[]>(endpoints.conversations.messages(conversationId!)),
    enabled: Boolean(conversationId),
    retry: shouldRetry,
  });
}

export function useDeleteConversation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiFetch<null>(endpoints.conversations.detail(conversationId), {
        method: "DELETE",
      }),
    onSuccess: (_data, conversationId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.conversations.messages(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(workspaceId),
      });
    },
  });
}
