import { db } from "@/server/db";
import { sourceChunk } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface CreateSourceChunkInput {
  sourceId: string;
  index: number;
  content: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateSourceChunkInput {
  content?: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Repository class managing direct database operations for the `source_chunk` table via Drizzle ORM.
 */
export class SourceChunkRepository {
  /**
   * Bulk inserts array of source chunk records into the database.
   *
   * @param chunks - Array of chunk objects containing sourceId, index, content, metadata.
   * @returns Array of inserted source chunk records.
   */
  static async createMany(chunks: CreateSourceChunkInput[]) {
    if (chunks.length === 0) return [];

    return await db
      .insert(sourceChunk)
      .values(
        chunks.map((c) => ({
          sourceId: c.sourceId,
          index: c.index,
          content: c.content,
          tokenCount: c.tokenCount || null,
          metadata: c.metadata || null,
        })),
      )
      .returning();
  }

  /**
   * Retrieves all chunks belonging to a specific source ID, ordered by chunk index ascending.
   *
   * @param sourceId - Parent source unique identifier.
   * @returns Array of source chunk records.
   */
  static async findBySourceId(sourceId: string) {
    return await db
      .select()
      .from(sourceChunk)
      .where(eq(sourceChunk.sourceId, sourceId))
      .orderBy(sourceChunk.index);
  }

  /**
   * Updates an existing source chunk record by its unique ID.
   *
   * @param id - Source chunk unique identifier.
   * @param input - Fields to update (content, tokenCount, metadata).
   * @returns Updated source chunk record or null if not found.
   */
  static async update(id: string, input: UpdateSourceChunkInput) {
    const [updated] = await db
      .update(sourceChunk)
      .set(input)
      .where(eq(sourceChunk.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Deletes all chunks associated with a specific source ID.
   *
   * @param sourceId - Parent source unique identifier.
   * @returns Deleted source chunk records.
   */
  static async deleteBySourceId(sourceId: string) {
    return await db
      .delete(sourceChunk)
      .where(eq(sourceChunk.sourceId, sourceId))
      .returning();
  }

  /**
   * Deletes all chunks associated with an array of source IDs in a single query.
   *
   * @param sourceIds - Array of parent source unique identifiers.
   * @returns Deleted source chunk records.
   */
  static async deleteBySourceIds(sourceIds: string[]) {
    if (sourceIds.length === 0) return [];

    return await db
      .delete(sourceChunk)
      .where(inArray(sourceChunk.sourceId, sourceIds))
      .returning();
  }
}

