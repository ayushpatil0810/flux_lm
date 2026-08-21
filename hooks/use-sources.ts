import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  apiFetch,
  endpoints,
  queryKeys,
  shouldRetry,
  type Source,
  type SourceListFilters,
} from "@/lib/api";

const PROCESSING_STATUSES = new Set(["PENDING", "PROCESSING"]);

/**
 * Lists sources for a workspace with optional type/status/search filters.
 * Polls gently while any visible source is still being processed, so
 * imports appear to settle into Ready on their own. Keeps previous data
 * while filter changes refetch to avoid flashing empty states.
 */
export function useSources(workspaceId: string, filters: SourceListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.sources.list(workspaceId, filters),
    queryFn: () =>
      apiFetch<Source[]>(endpoints.sources.list(workspaceId, filters)),
    retry: shouldRetry,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const sources = query.state.data;
      return sources?.some((source) => PROCESSING_STATUSES.has(source.status))
        ? 4000
        : false;
    },
  });
}

function useInvalidateSources(workspaceId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.sources.all(workspaceId),
    });
}

export function useImportWebsiteSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  return useMutation({
    mutationFn: (input: { url: string; title?: string }) =>
      apiFetch<Source>(endpoints.sources.importWebsite(), {
        method: "POST",
        json: { workspaceId, ...input },
      }),
    onSuccess: invalidate,
  });
}

export function useImportYoutubeSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  return useMutation({
    mutationFn: (input: { url: string; title?: string }) =>
      apiFetch<Source>(endpoints.sources.importYoutube(), {
        method: "POST",
        json: { workspaceId, ...input },
      }),
    onSuccess: invalidate,
  });
}

export function useImportTextSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  return useMutation({
    mutationFn: (input: {
      title: string;
      content: string;
      type?: "TEXT" | "MARKDOWN";
    }) =>
      apiFetch<Source>(endpoints.sources.importText(), {
        method: "POST",
        json: { workspaceId, ...input },
      }),
    onSuccess: invalidate,
  });
}

export function useImportPdfSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  return useMutation({
    mutationFn: (input: { file: File; title?: string }) => {
      const formData = new FormData();
      formData.set("workspaceId", workspaceId);
      if (input.title) formData.set("title", input.title);
      formData.set("file", input.file);
      return apiFetch<Source>(endpoints.sources.importPdf(), {
        method: "POST",
        formData,
      });
    },
    onSuccess: invalidate,
  });
}

export function useRenameSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sourceId: string; title: string }) =>
      apiFetch<Source>(endpoints.sources.detail(input.sourceId), {
        method: "PATCH",
        json: { title: input.title },
      }),
    onMutate: async ({ sourceId, title }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sources.all(workspaceId) });
      queryClient.setQueriesData<Source[]>(
        { queryKey: queryKeys.sources.all(workspaceId) },
        (old) => old?.map((s) => (s.id === sourceId ? { ...s, title } : s))
      );
    },
    onSettled: invalidate,
  });
}

export function useDeleteSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) =>
      apiFetch<null>(endpoints.sources.detail(sourceId), {
        method: "DELETE",
      }),
    onMutate: async (sourceId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sources.all(workspaceId) });
      queryClient.setQueriesData<Source[]>(
        { queryKey: queryKeys.sources.all(workspaceId) },
        (old) => old?.filter((s) => s.id !== sourceId)
      );
    },
    onSettled: invalidate,
  });
}

export function useBulkDeleteSources(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<unknown>(endpoints.sources.list(workspaceId), {
        method: "DELETE",
        json: { workspaceId, ids },
      }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sources.all(workspaceId) });
      queryClient.setQueriesData<Source[]>(
        { queryKey: queryKeys.sources.all(workspaceId) },
        (old) => old?.filter((s) => !ids.includes(s.id))
      );
    },
    onSettled: invalidate,
  });
}
