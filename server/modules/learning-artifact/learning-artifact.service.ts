import { ApiError } from "@/server/utils/api-error";
import { inngest } from "@/inngest/client";
import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { LearningArtifactRepository } from "./learning-artifact.repository";
import { CreateArtifactInput } from "./learning-artifact.validator";
import {
  gatherSourceContext,
  generateArtifactContent,
} from "./learning-artifact-generation";

export class LearningArtifactService {
  /**
   * Lists all learning artifacts in a workspace.
   */
  static async listArtifactsForWorkspace(workspaceId: string, userId: string) {
    await WorkspaceService.getWorkspaceById(workspaceId, userId);
    return await LearningArtifactRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * Loads a single artifact after verifying workspace ownership.
   */
  static async getArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
  ) {
    await WorkspaceService.getWorkspaceById(workspaceId, userId);

    const artifact = await LearningArtifactRepository.findByIdAndWorkspace(
      artifactId,
      workspaceId,
    );

    if (!artifact) {
      throw ApiError.notFound("Artifact not found");
    }

    return artifact;
  }

  /**
   * Creates a pending artifact and enqueues background generation via Inngest.
   */
  static async createArtifactForWorkspace(
    workspaceId: string,
    userId: string,
    input: CreateArtifactInput,
  ) {
    await WorkspaceService.getWorkspaceById(workspaceId, userId);

    // Validate that we have valid context before creating
    const context = await gatherSourceContext(workspaceId, input.sourceIds);

    const defaultTitle =
      {
        SUMMARY: "Summary",
        TAKEAWAYS: "Key Takeaways",
        FLASHCARDS: "Flashcards",
        QUIZ: "Quiz",
        MINDMAP: "Mind Map",
        REPORT: "AI Report",
      }[input.type] || "Artifact";

    const artifact = await LearningArtifactRepository.create({
      workspaceId,
      type: input.type,
      title:
        input.title || `${defaultTitle} · ${new Date().toLocaleDateString()}`,
      sourceIds: context.sourceIds,
      status: "PENDING",
    });

    await inngest.send({
      name: "artifact/generate",
      data: {
        artifactId: artifact.id,
        workspaceId,
      },
    });

    return artifact;
  }

  /**
   * Deletes an artifact from the workspace.
   */
  static async deleteArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
  ) {
    await LearningArtifactService.getArtifactForWorkspace(
      workspaceId,
      artifactId,
      userId,
    );
    await LearningArtifactRepository.delete(artifactId);
  }

  /**
   * Runs the full artifact generation pipeline (used by Inngest worker).
   */
  static async processArtifactById(artifactId: string) {
    const artifact = await LearningArtifactRepository.findById(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    await LearningArtifactRepository.update(artifactId, {
      status: "PROCESSING",
    });

    try {
      const context = await gatherSourceContext(
        artifact.workspaceId,
        artifact.sourceIds as string[],
      );

      const content = await generateArtifactContent(
        artifact.type,
        context.text,
      );

      return await LearningArtifactRepository.update(artifactId, {
        status: "READY",
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingError: undefined,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Artifact generation failed";

      await LearningArtifactRepository.update(artifactId, {
        status: "FAILED",
        metadata: {
          processingError: message,
        },
      });

      throw error;
    }
  }
}
