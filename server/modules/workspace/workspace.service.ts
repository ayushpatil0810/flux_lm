import { ApiError } from "@/server/utils/api-error";
import { WorkspaceRepository } from "./workspace.repository";
import { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspace.validator";

/**
 * Service class encapsulating business logic and rules for Workspace management.
 */
export class WorkspaceService {
  /**
   * Retrieves all workspaces belonging to a specific user.
   *
   * @param userId - ID of the owning user.
   * @returns List of workspace records.
   */
  static async getUserWorkspaces(userId: string) {
    return await WorkspaceRepository.findUserWorkspaces(userId);
  }

  /**
   * Retrieves a single workspace by ID after checking user ownership.
   *
   * @param id - Workspace unique identifier.
   * @param userId - ID of the user requesting access.
   * @returns Workspace record.
   * @throws {ApiError} 404 Not Found if workspace does not exist or user lacks access.
   */
  static async getWorkspaceById(id: string, userId: string) {
    const ws = await WorkspaceRepository.findByIdAndUser(id, userId);
    if (!ws) {
      throw ApiError.notFound("Workspace not found or access denied");
    }
    return ws;
  }

  /**
   * Creates a new workspace for the given user.
   *
   * @param userId - ID of the creator.
   * @param input - Validated creation payload.
   * @returns Newly created workspace record.
   */
  static async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    return await WorkspaceRepository.create(userId, input);
  }

  /**
   * Updates an existing workspace after verifying user ownership.
   *
   * @param id - Workspace unique identifier.
   * @param userId - ID of the user requesting update.
   * @param input - Validated update payload.
   * @returns Updated workspace record.
   */
  static async updateWorkspace(
    id: string,
    userId: string,
    input: UpdateWorkspaceInput
  ) {
    // Verify existence & ownership
    await WorkspaceService.getWorkspaceById(id, userId);

    return await WorkspaceRepository.update(id, input);
  }

  /**
   * Deletes a workspace after verifying user ownership.
   *
   * @param id - Workspace unique identifier.
   * @param userId - ID of the user requesting deletion.
   * @returns Deleted workspace record.
   */
  static async deleteWorkspace(id: string, userId: string) {
    // Verify existence & ownership
    await WorkspaceService.getWorkspaceById(id, userId);

    return await WorkspaceRepository.delete(id);
  }
}
