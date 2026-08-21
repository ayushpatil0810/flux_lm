import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  endpoints,
  queryKeys,
  shouldRetry,
  type MemoryItem,
} from "@/lib/api";

/**
 * Lists the current user's memories. When MEM0_API_KEY is not configured
 * the endpoint returns an empty list, so "no memories" can also mean
 * "memory is not enabled"; mutations surface that honestly as errors.
 */
export function useMemories() {
  return useQuery({
    queryKey: queryKeys.memories.all,
    queryFn: () => apiFetch<MemoryItem[]>(endpoints.memories.list()),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: shouldRetry,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<unknown>(endpoints.memories.list(), {
        method: "POST",
        json: { text },
      }),
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.memories.all });
      const previousMemories = queryClient.getQueryData<MemoryItem[]>(queryKeys.memories.all);
      
      const optimisticMemory: MemoryItem = {
        id: `temp-${Date.now()}`,
        memory: text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true,
      };
      
      queryClient.setQueryData<MemoryItem[]>(
        queryKeys.memories.all,
        (old) => (old ? [optimisticMemory, ...old] : [optimisticMemory])
      );
      
      return { previousMemories };
    },
    onError: (err, newMemory, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(queryKeys.memories.all, context.previousMemories);
      }
    },
    onSettled: () => {
      // Delay invalidation by 3s to allow Mem0 inference to finish
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.memories.all });
      }, 3000);
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; text: string }) =>
      apiFetch<unknown>(endpoints.memories.detail(input.id), {
        method: "PATCH",
        json: { text: input.text },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all }),
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<unknown>(endpoints.memories.detail(id), { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.all }),
  });
}
