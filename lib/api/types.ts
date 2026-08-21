import type { CHAT_MODELS } from "@/lib/constants";
import type {
  CitationMetadata,
  LearningArtifactContent,
  LearningArtifactMetadata,
  SourceMetadata,
} from "@/server/db/schema/types";

/*
 * Frontend mirrors of the Drizzle row types, as serialized over JSON.
 * Timestamps arrive as ISO strings. jsonb columns reuse the shared
 * metadata interfaces from server/db/schema/types (type-only imports,
 * no server runtime code is pulled into the client bundle).
 */

export type ChatModel = (typeof CHAT_MODELS)[number];

export type SourceType = "PDF" | "WEBSITE" | "YOUTUBE" | "TEXT" | "MARKDOWN";

export type SourceStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type ArtifactType =
  | "SUMMARY"
  | "TAKEAWAYS"
  | "FLASHCARDS"
  | "QUIZ"
  | "MINDMAP"
  | "REPORT";

export type ArtifactStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type MessageRole = "USER" | "ASSISTANT";

export type { CitationMetadata, LearningArtifactContent, LearningArtifactMetadata, SourceMetadata };

export interface Workspace {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  icon: string | null;
  defaultModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  workspaceId: string;
  type: SourceType;
  title: string;
  content: string | null;
  url: string | null;
  status: SourceStatus;
  metadata: SourceMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string | null;
  summary: string | null;
  summaryMessageCount: number;
  summarizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  citations: CitationMetadata[] | null;
  createdAt: string;
}

export interface LearningArtifact {
  id: string;
  workspaceId: string;
  type: ArtifactType;
  title: string;
  content: LearningArtifactContent | null;
  sourceIds: string[] | null;
  status: ArtifactStatus;
  metadata: LearningArtifactMetadata | null;
  createdAt: string;
  updatedAt: string;
}

/** Memory record as returned by the mem0-backed GET /api/memories endpoint. */
export interface MemoryItem {
  id: string;
  memory: string;
  user_id?: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  isOptimistic?: boolean;
}

/** Query filters accepted by GET /api/sources. */
export interface SourceListFilters {
  type?: SourceType;
  status?: SourceStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

/** Minimal UI message shape accepted by the streaming chat endpoint. */
export interface ChatRequestMessage {
  id?: string;
  role: "system" | "user" | "assistant";
  parts: Array<{ type: string; text?: string } & Record<string, unknown>>;
}

/** Request body for POST /api/workspaces/[id]/chat (plain text stream response). */
export interface StreamChatRequest {
  conversationId?: string;
  messages: ChatRequestMessage[];
  model?: ChatModel;
  webSearch?: boolean;
}

/** Payload for POST /api/workspaces. Matches createWorkspaceSchema. */
export interface CreateWorkspaceRequest {
  title: string;
  description?: string;
  icon?: string;
  defaultModel?: string;
}
