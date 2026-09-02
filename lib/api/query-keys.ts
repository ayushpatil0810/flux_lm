import type { SourceListFilters } from "./types";

/**
 * Central TanStack Query key factory. Keys are hierarchical so invalidating
 * a workspace prefix (e.g. ["workspaces", id]) clears its sources,
 * conversations, and artifacts in one call.
 */
export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },
  sources: {
    all: (workspaceId: string) =>
      ["workspaces", workspaceId, "sources"] as const,
    list: (workspaceId: string, filters: SourceListFilters = {}) =>
      ["workspaces", workspaceId, "sources", "list", filters] as const,
    detail: (id: string) => ["sources", id] as const,
  },
  conversations: {
    all: (workspaceId: string) =>
      ["workspaces", workspaceId, "conversations"] as const,
    detail: (id: string) => ["conversations", id] as const,
    messages: (id: string) => ["conversations", id, "messages"] as const,
  },
  artifacts: {
    all: (workspaceId: string) =>
      ["workspaces", workspaceId, "artifacts"] as const,
    detail: (workspaceId: string, artifactId: string) =>
      ["workspaces", workspaceId, "artifacts", artifactId] as const,
  },
  memories: {
    all: ["memories"] as const,
  },
} as const;
