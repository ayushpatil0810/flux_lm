import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { ApiError } from "@/server/utils/api-error";
import { SourceRepository } from "./source.repository";
import {
  BulkDeleteSourcesInput,
  CreateSourceInput,
  UpdateSourceInput,
} from "./source.validator";

/**
 * Service class encapsulating business logic and access control for Source management.
 */
export class SourceService {
  /**
   * Retrieves all sources for a workspace after verifying user ownership.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param userId - Requesting user identifier.
   * @returns Array of source records.
   */
  static async getWorkspaceSources(workspaceId: string, userId: string) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(workspaceId, userId);

    return await SourceRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * Retrieves a single source record by ID after verifying workspace access.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @returns Source record.
   * @throws {ApiError} 404 Not Found if source is not found or access is denied.
   */
  static async getSourceById(id: string, userId: string) {
    const existingSource = await SourceRepository.findById(id);
    if (!existingSource) {
      throw ApiError.notFound("Source not found");
    }

    // Verify workspace access
    await WorkspaceService.getWorkspaceById(existingSource.workspaceId, userId);

    return existingSource;
  }

  /**
   * Creates a new source after verifying user ownership of the parent workspace.
   *
   * @param userId - Creator user identifier.
   * @param input - Validated source creation payload.
   * @returns Newly created source record.
   */
  static async createSource(userId: string, input: CreateSourceInput) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    return await SourceRepository.create(input);
  }

  /**
   * Updates a source record after verifying user ownership.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @param input - Validated update payload.
   * @returns Updated source record.
   */
  static async updateSource(
    id: string,
    userId: string,
    input: UpdateSourceInput,
  ) {
    // Verify existence & workspace access
    await SourceService.getSourceById(id, userId);

    return await SourceRepository.update(id, input);
  }

  /**
   * Deletes a source record after verifying user ownership.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @returns Deleted source record.
   */
  static async deleteSource(id: string, userId: string) {
    // Verify existence & workspace access
    await SourceService.getSourceById(id, userId);

    return await SourceRepository.delete(id);
  }

  /**
   * Bulk deletes multiple sources belonging to a workspace after verifying user ownership.
   *
   * @param userId - Requesting user identifier.
   * @param input - Validated bulk delete payload (workspaceId and ids array).
   * @returns Summary object containing count and deleted IDs.
   */
  static async bulkDeleteSources(
    userId: string,
    input: BulkDeleteSourcesInput,
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    const deleted = await SourceRepository.deleteMany(
      input.workspaceId,
      input.ids,
    );

    return {
      deletedCount: deleted.length,
      deletedIds: deleted.map((s) => s.id),
    };
  }
}
