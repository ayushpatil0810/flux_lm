import type { SourceListFilters } from "./types";

function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/** Single source of truth for REST endpoint paths used by the frontend. */
export const endpoints = {
  workspaces: {
    list: () => "/api/workspaces",
    detail: (id: string) => `/api/workspaces/${id}`,
  },
  sources: {
    list: (workspaceId: string, filters: SourceListFilters = {}) =>
      withQuery("/api/sources", { workspaceId, ...filters }),
    detail: (id: string) => `/api/sources/${id}`,
    importPdf: () => "/api/sources/import/pdf",
    importWebsite: () => "/api/sources/import/website",
    importText: () => "/api/sources/import/text",
    importYoutube: () => "/api/sources/import/youtube",
  },
  conversations: {
    list: (workspaceId: string) =>
      withQuery("/api/conversations", { workspaceId }),
    detail: (id: string) => `/api/conversations/${id}`,
    messages: (id: string, limit?: number) =>
      withQuery(`/api/conversations/${id}/messages`, { limit }),
  },
  chat: (workspaceId: string) => `/api/workspaces/${workspaceId}/chat`,
  artifacts: {
    list: (workspaceId: string) => `/api/workspaces/${workspaceId}/artifacts`,
    detail: (workspaceId: string, artifactId: string) =>
      `/api/workspaces/${workspaceId}/artifacts/${artifactId}`,
  },
  memories: {
    list: () => "/api/memories",
    detail: (id: string) => `/api/memories/${id}`,
  },
} as const;
