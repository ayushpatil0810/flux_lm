import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { LearningArtifactService } from "./learning-artifact.service";
import { createArtifactSchema } from "./learning-artifact.validator";

/**
 * Controller class handling HTTP requests for Learning Artifacts.
 */
export class LearningArtifactController {
  private static async getContext(req: NextRequest, params: Promise<{ id: string; artifactId: string }>) {
    const user = await getAuthenticatedUser(req);
    const { id: workspaceId, artifactId } = await params;
    return { user, workspaceId, artifactId };
  }

  /**
   * Handles GET /api/workspaces/[id]/artifacts
   * Fetches all artifacts for a workspace.
   */
  static listArtifacts = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id: workspaceId } = await params;
      const artifacts = await LearningArtifactService.listArtifactsForWorkspace(
        workspaceId,
        user.id,
      );
      return ApiResponse.success(artifacts);
    },
  );

  /**
   * Handles GET /api/workspaces/[id]/artifacts/[artifactId]
   * Fetches a single artifact by ID.
   */
  static getArtifact = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string; artifactId: string }> },
    ) => {
      const { user, workspaceId, artifactId } = await LearningArtifactController.getContext(req, params);
      const artifact = await LearningArtifactService.getArtifactForWorkspace(
        workspaceId,
        artifactId,
        user.id,
      );
      return ApiResponse.success(artifact);
    },
  );

  /**
   * Handles POST /api/workspaces/[id]/artifacts
   * Creates a new artifact request and queues processing.
   */
  static createArtifact = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id: workspaceId } = await params;
      const body = await req.json();

      const validation = createArtifactSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const newArtifact = await LearningArtifactService.createArtifactForWorkspace(
        workspaceId,
        user.id,
        validation.data,
      );
      return ApiResponse.created(newArtifact, "Artifact generation queued");
    },
  );

  /**
   * Handles DELETE /api/workspaces/[id]/artifacts/[artifactId]
   * Deletes a single artifact.
   */
  static deleteArtifact = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string; artifactId: string }> },
    ) => {
      const { user, workspaceId, artifactId } = await LearningArtifactController.getContext(req, params);
      await LearningArtifactService.deleteArtifactForWorkspace(
        workspaceId,
        artifactId,
        user.id,
      );
      return ApiResponse.success(null, "Artifact deleted successfully");
    },
  );
}
