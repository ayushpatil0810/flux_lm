import { MemoryClient } from "mem0ai";
import { logger } from "./logger";

// Initialize the Mem0 client using the API key from environment variables.
const client = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY || "",
});

/**
 * Searches the user's long-term memory for relevant context.
 * Returns an array of memory objects if found.
 */
export async function searchUserMemories(userId: string, query: string) {
  if (!process.env.MEM0_API_KEY) {
    logger.warn({ userId }, "[Mem0] MEM0_API_KEY not set. Skipping search.");
    return [] as { memory: string }[];
  }

  try {
    const response = await client.search(query, { filters: { userId } });
    return response.results.map((result) => ({
      memory: result.memory || "",
    }));
  } catch (error) {
    logger.error({ userId, error }, "[Mem0] Failed to search user memories.");
    return [] as { memory: string }[];
  }
}

/**
 * Adds new conversational messages to the user's long-term memory.
 * Mem0 automatically infers facts, preferences, and context to store.
 */
export async function addMemoriesFromMessages(
  userId: string,
  messages: { role: string; content: string }[],
  metadata?: Record<string, unknown>
) {
  if (!process.env.MEM0_API_KEY) {
    logger.warn({ userId }, "[Mem0] MEM0_API_KEY not set. Skipping addition.");
    return;
  }

  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    await client.add(formattedMessages, {
      userId,
      metadata,
    });
    
    logger.info({ userId }, "[Mem0] Successfully added memories.");
  } catch (error) {
    logger.error({ userId, error }, "[Mem0] Failed to add memories.");
  }
}
