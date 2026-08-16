import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { MemoryService } from "./memory.service";
import { createMemorySchema, updateMemorySchema } from "./memory.validator";

/**
 * Controller class handling HTTP requests and responses for Memory operations.
 */
export class MemoryController {
  /**
   * Handles GET /api/memories

   * Fetches all memories for the authenticated user.
   */
  static listMemories = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    const memories = await MemoryService.getUserMemories(user.id);
    return ApiResponse.success(memories);
  });

  /**
   * Handles POST /api/memories
   * Manually creates a new memory for the authenticated user.
   */
  static createMemory = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createMemorySchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const newMemory = await MemoryService.createMemory(user.id, validation.data);
    return ApiResponse.created(newMemory, "Memory created successfully");
  });

  /**
   * Handles PATCH /api/memories/[id]
   * Updates an existing memory's text.
   */
  static updateMemory = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      await getAuthenticatedUser(req);
      const { id } = await params;
      const body = await req.json();

      const validation = updateMemorySchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const updated = await MemoryService.updateMemory(id, validation.data);
      return ApiResponse.success(updated, "Memory updated successfully");
    },
  );

  /**
   * Handles DELETE /api/memories/[id]
   * Deletes a specific memory.
   */
  static deleteMemory = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      await getAuthenticatedUser(req);
      const { id } = await params;
      await MemoryService.deleteMemory(id);
      return ApiResponse.success(null, "Memory deleted successfully");
    },
  );
}
