import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { LearningArtifactService } from "./learning-artifact.service";
import { createArtifactSchema } from "./learning-artifact.validator";

/**
 * Controller class handling HTTP requests for Learning Artifacts.
 */
export class LearningArtifactController {
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
   * Handles GET /api/workspaces/[id]/artifacts
   * Fetches all artifacts for a workspace.
   */
  static listArtifacts = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await LearningArtifactController.getAuthenticatedUser(req);
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
      const user = await LearningArtifactController.getAuthenticatedUser(req);
      const { id: workspaceId, artifactId } = await params;
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
      const user = await LearningArtifactController.getAuthenticatedUser(req);
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
      const user = await LearningArtifactController.getAuthenticatedUser(req);
      const { id: workspaceId, artifactId } = await params;
      await LearningArtifactService.deleteArtifactForWorkspace(
        workspaceId,
        artifactId,
        user.id,
      );
      return ApiResponse.success(null, "Artifact deleted successfully");
    },
  );
}
