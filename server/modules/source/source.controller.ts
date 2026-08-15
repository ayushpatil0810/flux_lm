import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { SourceService } from "./source.service";
import {
  bulkDeleteSourcesSchema,
  createSourceSchema,
  updateSourceSchema,
} from "./source.validator";

/**
 * Controller class handling HTTP requests for Source operations.
 */
export class SourceController {
  /**
   * Helper method to retrieve the authenticated user from session headers.
   *
   * @param req - Incoming NextRequest object.
   * @returns Authenticated user.
   * @throws {ApiError} 401 Unauthorized if authentication fails.
   */
  private static async getAuthenticatedUser(req: NextRequest) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    return session.user;
  }

  /**
   * Handles GET /api/sources?workspaceId=...
   * Fetches all sources for a specific workspace.
   */
  static listSources = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      throw ApiError.badRequest("workspaceId query parameter is required");
    }

    const sources = await SourceService.getWorkspaceSources(
      workspaceId,
      user.id,
    );
    return ApiResponse.success(sources);
  });

  /**
   * Handles GET /api/sources/[id]
   * Fetches a single source by ID.
   */
  static getSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      const src = await SourceService.getSourceById(id, user.id);
      return ApiResponse.success(src);
    },
  );

  /**
   * Handles POST /api/sources
   * Creates a new source.
   */
  static createSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const newSource = await SourceService.createSource(user.id, validation.data);
    return ApiResponse.created(newSource, "Source created successfully");
  });

  /**
   * Handles PATCH /api/sources/[id]
   * Updates an existing source.
   */
  static updateSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      const body = await req.json();

      const validation = updateSourceSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const updated = await SourceService.updateSource(
        id,
        user.id,
        validation.data,
      );
      return ApiResponse.success(updated, "Source updated successfully");
    },
  );

  /**
   * Handles DELETE /api/sources/[id]
   * Deletes a single source.
   */
  static deleteSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      await SourceService.deleteSource(id, user.id);
      return ApiResponse.success(null, "Source deleted successfully");
    },
  );

  /**
   * Handles DELETE /api/sources (or POST /api/sources/bulk-delete)
   * Bulk deletes multiple sources for a workspace.
   */
  static bulkDeleteSources = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = bulkDeleteSourcesSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const result = await SourceService.bulkDeleteSources(
      user.id,
      validation.data,
    );
    return ApiResponse.success(result, "Sources deleted successfully");
  });
}
