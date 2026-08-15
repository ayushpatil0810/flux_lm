import { db } from "@/server/db";
import { workspace } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspace.validator";

/**
 * Repository class managing direct database interactions for the `workspace` table via Drizzle ORM.
 */
export class WorkspaceRepository {
  /**
   * Queries all workspaces associated with a user ID.
   *
   * @param userId - ID of the user.
   * @returns Promise resolving to an array of workspaces.
   */
  static async findUserWorkspaces(userId: string) {
    return await db
      .select()
      .from(workspace)
      .where(eq(workspace.userId, userId));
  }

  /**
   * Queries a workspace by its unique ID.
   *
   * @param id - Unique workspace identifier.
   * @returns Workspace record or null if not found.
   */
  static async findById(id: string) {
    const [result] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, id))
      .limit(1);

    return result || null;
  }

  /**
   * Queries a workspace matching both ID and owning user ID.
   *
   * @param id - Unique workspace identifier.
   * @param userId - Owner user identifier.
   * @returns Workspace record or null if not matching.
   */
  static async findByIdAndUser(id: string, userId: string) {
    const [result] = await db
      .select()
      .from(workspace)
      .where(and(eq(workspace.id, id), eq(workspace.userId, userId)))
      .limit(1);

    return result || null;
  }

  /**
   * Inserts a new workspace record into the database.
   *
   * @param userId - Creator user ID.
   * @param input - Creation input properties.
   * @returns Inserted workspace record.
   */
  static async create(userId: string, input: CreateWorkspaceInput) {
    const [newWorkspace] = await db
      .insert(workspace)
      .values({
        userId,
        title: input.title,
        description: input.description,
        icon: input.icon,
        defaultModel: input.defaultModel,
      })
      .returning();

    return newWorkspace;
  }

  /**
   * Updates fields of an existing workspace record.
   *
   * @param id - Unique workspace identifier.
   * @param input - Partial workspace fields to update.
   * @returns Updated workspace record or null if not found.
   */
  static async update(id: string, input: UpdateWorkspaceInput) {
    const [updated] = await db
      .update(workspace)
      .set(input)
      .where(eq(workspace.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Deletes a workspace record from the database.
   *
   * @param id - Unique workspace identifier.
   * @returns Deleted workspace record or null if not found.
   */
  static async delete(id: string) {
    const [deleted] = await db
      .delete(workspace)
      .where(eq(workspace.id, id))
      .returning();

    return deleted || null;
  }
}
