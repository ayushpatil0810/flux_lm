import { getUserMemories, addMemory, updateUserMemory, deleteUserMemory } from "@/lib/mem0";
import { CreateMemoryInput, UpdateMemoryInput } from "./memory.validator";
import { ApiError } from "@/server/utils/api-error";

export class MemoryService {
  /**
   * Retrieves all memories for a user.
   */
  static async getUserMemories(userId: string) {
    try {
      const memories = await getUserMemories(userId);
      return memories;
    } catch (error) {
      throw ApiError.internal("Failed to retrieve user memories");
    }
  }

  /**
   * Creates a new memory for a user manually.
   */
  static async createMemory(userId: string, input: CreateMemoryInput) {
    try {
      const memory = await addMemory(userId, input.text);
      if (!memory) {
        throw ApiError.internal("Memory creation returned no data, check MEM0_API_KEY");
      }
      return memory;
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to create memory");
    }
  }

  /**
   * Updates an existing memory.
   */
  static async updateMemory(memoryId: string, input: UpdateMemoryInput) {
    try {
      const updated = await updateUserMemory(memoryId, input.text);
      if (!updated) {
        throw ApiError.internal("Memory update returned no data, check MEM0_API_KEY");
      }
      return updated;
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to update memory");
    }
  }

  /**
   * Deletes a memory by its ID.
   */
  static async deleteMemory(memoryId: string) {
    try {
      const response = await deleteUserMemory(memoryId);
      if (!response) {
        throw ApiError.internal("Memory deletion returned no data, check MEM0_API_KEY");
      }
      return response;
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to delete memory");
    }
  }
}
