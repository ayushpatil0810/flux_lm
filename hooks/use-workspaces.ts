import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  endpoints,
  queryKeys,
  shouldRetry,
  type CreateWorkspaceRequest,
  type Workspace,
} from "@/lib/api";

/** Lists all workspaces owned by the current user. */
export function useWorkspaces(initialData?: Workspace[]) {
  return useQuery({
    queryKey: queryKeys.workspaces.all,
    queryFn: () => apiFetch<Workspace[]>(endpoints.workspaces.list()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    initialData,
  });
}

export function useWorkspace(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(workspaceId || ""),
    queryFn: () =>
      apiFetch<Workspace>(endpoints.workspaces.detail(workspaceId!)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: shouldRetry,
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceRequest) =>
      apiFetch<Workspace>(endpoints.workspaces.list(), {
        method: "POST",
        json: input,
      }),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.setQueryData(
        queryKeys.workspaces.detail(workspace.id),
        workspace,
      );
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiFetch<null>(endpoints.workspaces.detail(workspaceId), {
        method: "DELETE",
      }),
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.all });
      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        queryKeys.workspaces.all,
      );
      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(
          queryKeys.workspaces.all,
          previousWorkspaces.filter((ws) => ws.id !== workspaceId),
        );
      }

      const previousDetail = queryClient.getQueryData<Workspace>(
        queryKeys.workspaces.detail(workspaceId),
      );
      if (previousDetail) {
        queryClient.removeQueries({
          queryKey: queryKeys.workspaces.detail(workspaceId),
        });
      }

      return { previousWorkspaces, previousDetail };
    },
    onError: (err, variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          queryKeys.workspaces.all,
          context.previousWorkspaces,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.workspaces.detail(variables),
          context.previousDetail,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onSuccess: (_data, workspaceId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.workspaces.detail(workspaceId),
      });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { title?: string; description?: string; defaultModel?: string };
    }) =>
      apiFetch<Workspace>(endpoints.workspaces.detail(id), {
        method: "PATCH",
        json: input,
      }),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workspaces.all });
      const previousWorkspaces = queryClient.getQueryData<Workspace[]>(
        queryKeys.workspaces.all,
      );
      if (previousWorkspaces) {
        queryClient.setQueryData<Workspace[]>(
          queryKeys.workspaces.all,
          previousWorkspaces.map((ws) =>
            ws.id === id ? { ...ws, ...input } : ws,
          ),
        );
      }
      return { previousWorkspaces };
    },
    onError: (err, variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          queryKeys.workspaces.all,
          context.previousWorkspaces,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onSuccess: (workspace) => {
      queryClient.setQueryData(
        queryKeys.workspaces.detail(workspace.id),
        workspace,
      );
    },
  });
}
