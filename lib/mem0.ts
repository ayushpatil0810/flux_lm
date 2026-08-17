import { MemoryClient } from "mem0ai";
import { logger } from "./logger";
import { env } from "@/lib/env";

// Initialize the Mem0 client using the API key from environment variables.
const client = new MemoryClient({
  apiKey: env.MEM0_API_KEY || "",
});

/**
 * Searches the user's long-term memory for relevant context.
 * Returns an array of memory objects if found.
 */
export async function searchUserMemories(userId: string, query: string) {
  if (!env.MEM0_API_KEY) {
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
  if (!env.MEM0_API_KEY) {
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

/**
 * Retrieves all memories for a specific user.
 */
export async function getUserMemories(userId: string) {
  if (!env.MEM0_API_KEY) {
    logger.warn({ userId }, "[Mem0] MEM0_API_KEY not set. Skipping list.");
    return [];
  }

  try {
    const response = await client.getAll({ filters: { userId } });
    return response.results;
  } catch (error) {
    logger.error({ userId, error }, "[Mem0] Failed to get user memories.");
    throw error;
  }
}

/**
 * Manually adds a specific memory for a user.
 */
export async function addMemory(userId: string, text: string) {
  if (!env.MEM0_API_KEY) {
    logger.warn({ userId }, "[Mem0] MEM0_API_KEY not set. Skipping add.");
    return null;
  }

  try {
    const response = await client.add([{ role: "user", content: text }], { userId });
    return response;
  } catch (error) {
    logger.error({ userId, error }, "[Mem0] Failed to add user memory.");
    throw error;
  }
}

/**
 * Updates a specific memory by its ID.
 */
export async function updateUserMemory(memoryId: string, text: string) {
  if (!env.MEM0_API_KEY) {
    logger.warn({ memoryId }, "[Mem0] MEM0_API_KEY not set. Skipping update.");
    return null;
  }

  try {
    const response = await client.update(memoryId, { text });
    return response;
  } catch (error) {
    logger.error({ memoryId, error }, "[Mem0] Failed to update memory.");
    throw error;
  }
}

/**
 * Deletes a specific memory by its ID.
 */
export async function deleteUserMemory(memoryId: string) {
  if (!env.MEM0_API_KEY) {
    logger.warn({ memoryId }, "[Mem0] MEM0_API_KEY not set. Skipping delete.");
    return null;
  }

  try {
    const response = await client.delete(memoryId);
    return response;
  } catch (error) {
    logger.error({ memoryId, error }, "[Mem0] Failed to delete memory.");
    throw error;
  }
}
