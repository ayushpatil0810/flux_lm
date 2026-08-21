import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  endpoints,
  queryKeys,
  shouldRetry,
  type ArtifactType,
  type LearningArtifact,
} from "@/lib/api";

const PROCESSING_STATUSES = new Set(["PENDING", "PROCESSING"]);

/**
 * Lists a workspace's artifacts, newest first. Polls gently while any
 * artifact is still being generated so it settles into Ready on its own.
 */
export function useArtifacts(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.artifacts.all(workspaceId),
    queryFn: () =>
      apiFetch<LearningArtifact[]>(endpoints.artifacts.list(workspaceId)),
    retry: shouldRetry,
    refetchInterval: (query) =>
      query.state.data?.some((artifact) =>
        PROCESSING_STATUSES.has(artifact.status),
      )
        ? 4000
        : false,
  });
}

/** Fetches one artifact; polls while generation is in flight. */
export function useArtifact(workspaceId: string, artifactId: string) {
  return useQuery({
    queryKey: queryKeys.artifacts.detail(workspaceId, artifactId),
    queryFn: () =>
      apiFetch<LearningArtifact>(
        endpoints.artifacts.detail(workspaceId, artifactId),
      ),
    retry: shouldRetry,
    refetchInterval: (query) =>
      query.state.data && PROCESSING_STATUSES.has(query.state.data.status)
        ? 4000
        : false,
  });
}

export function useCreateArtifact(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: ArtifactType;
      title?: string;
      sourceIds?: string[];
    }) =>
      apiFetch<LearningArtifact>(endpoints.artifacts.list(workspaceId), {
        method: "POST",
        json: input,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.artifacts.all(workspaceId),
      }),
  });
}

export function useDeleteArtifact(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artifactId: string) =>
      apiFetch<null>(endpoints.artifacts.detail(workspaceId, artifactId), {
        method: "DELETE",
      }),
    onSuccess: (_data, artifactId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.artifacts.detail(workspaceId, artifactId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.artifacts.all(workspaceId),
      });
    },
  });
}
