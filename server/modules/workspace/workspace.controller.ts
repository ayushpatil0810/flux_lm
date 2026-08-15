import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { NextRequest } from "next/server";
import { WorkspaceService } from "./workspace.service";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "./workspace.validator";

/**
 * Controller class handling HTTP requests and responses for Workspace operations.
 * Connects Route Handlers to the WorkspaceService layer.
 */
export class WorkspaceController {
  /**
   * Helper method to retrieve the currently authenticated user from session headers.
   *
   * @param req - Incoming NextRequest object containing headers.
   * @returns The authenticated User object.
   * @throws {ApiError} 401 Unauthorized if no active session is found.
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
   * Handles GET /api/workspaces
   * Fetches all workspaces created by the authenticated user.
   *
   * @param req - Incoming NextRequest object.
   * @returns NextResponse with array of user workspaces.
   */
  static listWorkspaces = asyncHandler(async (req: NextRequest) => {
    const user = await WorkspaceController.getAuthenticatedUser(req);
    const workspaces = await WorkspaceService.getUserWorkspaces(user.id);
    return ApiResponse.success(workspaces);
  });

  /**
   * Handles GET /api/workspaces/[id]
   * Fetches a single workspace by ID if owned by the authenticated user.
   *
   * @param req - Incoming NextRequest object.
   * @param context - Route context containing params promise.
   * @returns NextResponse with the requested workspace object.
   */
  static getWorkspace = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await WorkspaceController.getAuthenticatedUser(req);
      const { id } = await params;
      const ws = await WorkspaceService.getWorkspaceById(id, user.id);
      return ApiResponse.success(ws);
    },
  );

  /**
   * Handles POST /api/workspaces
   * Validates body payload and creates a new workspace for the authenticated user.
   *
   * @param req - Incoming NextRequest object with JSON payload.
   * @returns NextResponse with status 201 and created workspace object.
   */
  static createWorkspace = asyncHandler(async (req: NextRequest) => {
    const user = await WorkspaceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createWorkspaceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const ws = await WorkspaceService.createWorkspace(user.id, validation.data);
    return ApiResponse.created(ws, "Workspace created successfully");
  });

  /**
   * Handles PATCH /api/workspaces/[id]
   * Validates body payload and updates an existing workspace.
   *
   * @param req - Incoming NextRequest object with partial JSON payload.
   * @param context - Route context containing params promise.
   * @returns NextResponse with the updated workspace object.
   */
  static updateWorkspace = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await WorkspaceController.getAuthenticatedUser(req);
      const { id } = await params;
      const body = await req.json();

      const validation = updateWorkspaceSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const updated = await WorkspaceService.updateWorkspace(
        id,
        user.id,
        validation.data,
      );
      return ApiResponse.success(updated, "Workspace updated successfully");
    },
  );

  /**
   * Handles DELETE /api/workspaces/[id]
   * Deletes a workspace owned by the authenticated user.
   *
   * @param req - Incoming NextRequest object.
   * @param context - Route context containing params promise.
   * @returns NextResponse confirming deletion.
   */
  static deleteWorkspace = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await WorkspaceController.getAuthenticatedUser(req);
      const { id } = await params;
      await WorkspaceService.deleteWorkspace(id, user.id);
      return ApiResponse.success(null, "Workspace deleted successfully");
    },
  );
}
