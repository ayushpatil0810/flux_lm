import { ApiClientError } from "./client";
import { endpoints } from "./endpoints";
import type { StreamChatRequest } from "./types";

interface StreamWorkspaceChatOptions {
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}

interface StreamWorkspaceChatResult {
  /**
   * The conversation the exchange was persisted to. When the request
   * omitted conversationId, the server creates one and returns its id
   * in the X-Conversation-Id response header.
   */
  conversationId: string | null;
}

/**
 * POSTs a chat exchange and reads the plain-text streaming response.
 * Failures before streaming starts arrive as the standard JSON error
 * envelope and are thrown as ApiClientError like any other endpoint.
 */
export async function streamWorkspaceChat(
  workspaceId: string,
  payload: StreamChatRequest,
  { signal, onChunk }: StreamWorkspaceChatOptions,
): Promise<StreamWorkspaceChatResult> {
  let response: Response;
  try {
    response = await fetch(endpoints.chat(workspaceId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiClientError(
      0,
      "Network request failed. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    let details: unknown;
    try {
      const envelope = (await response.json()) as {
        success: false;
        error?: string;
        details?: unknown;
      };
      if (typeof envelope.error === "string" && envelope.error) {
        message = envelope.error;
      }
      details = envelope.details;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiClientError(response.status, message, details);
  }

  if (!response.body) {
    throw new ApiClientError(
      response.status,
      "The server did not return a stream.",
    );
  }

  const conversationId = response.headers.get("X-Conversation-Id");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    const tail = decoder.decode();
    if (tail) onChunk(tail);
  } finally {
    reader.releaseLock();
  }

  return { conversationId };
}
