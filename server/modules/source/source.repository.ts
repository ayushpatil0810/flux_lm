import { db } from "@/server/db";
import { source } from "@/server/db/schema";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  CreateSourceInput,
  ListSourcesQuery,
  UpdateSourceInput,
} from "./source.validator";

/**
 * Repository class managing direct database operations for the `source` table via Drizzle ORM.
 */
export class SourceRepository {
  /**
   * Queries sources associated with a workspace ID, supporting filtering by type, status, search query (q), and ordered by createdAt desc.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param filters - Optional filters (type, status, search query q).
   * @returns Array of source records.
   */
  static async findByWorkspaceId(
    workspaceId: string,
    filters: Partial<Omit<ListSourcesQuery, "workspaceId">> = {},
  ) {
    const conditions = [eq(source.workspaceId, workspaceId)];

    if (filters.type) {
      conditions.push(eq(source.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(source.status, filters.status));
    }

    if (filters.q) {
      const searchPattern = `%${filters.q}%`;
      conditions.push(
        or(
          ilike(source.title, searchPattern),
          ilike(source.content, searchPattern),
        )!,
      );
    }

    return await db
      .select()
      .from(source)
      .where(and(...conditions))
      .orderBy(desc(source.createdAt));
  }

  /**
   * Queries a source record by its unique ID.
   *
   * @param id - Source unique identifier.
   * @returns Source record or null if not found.
   */
  static async findById(id: string) {
    const [result] = await db
      .select()
      .from(source)
      .where(eq(source.id, id))
      .limit(1);

    return result || null;
  }

  /**
   * Queries a source record matching both ID and workspace ID.
   *
   * @param id - Source unique identifier.
   * @param workspaceId - Workspace unique identifier.
   * @returns Source record or null if not matching.
   */
  static async findByIdAndWorkspace(id: string, workspaceId: string) {
    const [result] = await db
      .select()
      .from(source)
      .where(and(eq(source.id, id), eq(source.workspaceId, workspaceId)))
      .limit(1);

    return result || null;
  }

  /**
   * Inserts a new source record into the database.
   *
   * @param input - Creation payload containing workspaceId, type, title, etc.
   * @returns Inserted source record.
   */
  static async create(input: CreateSourceInput) {
    const [newSource] = await db
      .insert(source)
      .values({
        workspaceId: input.workspaceId,
        type: input.type,
        title: input.title,
        content: input.content,
        url: input.url || null,
        metadata: input.metadata || null,
      })
      .returning();

    return newSource;
  }

  /**
   * Updates an existing source record.
   *
   * @param id - Source unique identifier.
   * @param input - Update payload fields.
   * @returns Updated source record or null if not found.
   */
  static async update(id: string, input: UpdateSourceInput) {
    const [updated] = await db
      .update(source)
      .set(input)
      .where(eq(source.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Deletes a single source record from the database.
   *
   * @param id - Source unique identifier.
   * @returns Deleted source record or null if not found.
   */
  static async delete(id: string) {
    const [deleted] = await db
      .delete(source)
      .where(eq(source.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Deletes multiple source records matching a workspace ID and array of IDs.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param ids - Array of source IDs to delete.
   * @returns Array of deleted source records.
   */
  static async deleteMany(workspaceId: string, ids: string[]) {
    return await db
      .delete(source)
      .where(and(eq(source.workspaceId, workspaceId), inArray(source.id, ids)))
      .returning();
  }
}
