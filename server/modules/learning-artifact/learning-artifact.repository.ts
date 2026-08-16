import { db } from "@/server/db";
import { learningArtifact } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";

export interface CreateLearningArtifactInput {
  workspaceId: string;
  type: "SUMMARY" | "TAKEAWAYS" | "FLASHCARDS" | "QUIZ" | "MINDMAP" | "REPORT";
  title: string;
  content?: unknown;
  sourceIds?: string[];
  status?: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  metadata?: Record<string, unknown>;
}

export interface UpdateLearningArtifactInput {
  title?: string;
  content?: unknown;
  status?: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  metadata?: Record<string, unknown>;
}

/**
 * Repository class managing direct database operations for the `learning_artifact` table via Drizzle ORM.
 */
export class LearningArtifactRepository {
  /**
   * Retrieves all learning artifacts belonging to a workspace with optional filters.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param filters - Optional filters (type, status).
   * @returns Array of learning artifact records.
   */
  static async findByWorkspaceId(
    workspaceId: string,
    filters: { type?: string; status?: string } = {},
  ) {
    const conditions = [eq(learningArtifact.workspaceId, workspaceId)];

    if (filters.type) {
      conditions.push(eq(learningArtifact.type, filters.type as any));
    }

    if (filters.status) {
      conditions.push(eq(learningArtifact.status, filters.status as any));
    }

    return await db
      .select()
      .from(learningArtifact)
      .where(and(...conditions))
      .orderBy(desc(learningArtifact.createdAt));
  }

  /**
   * Queries a single learning artifact by unique ID.
   *
   * @param id - Artifact unique identifier.
   * @returns Learning artifact record or null if not found.
   */
  static async findById(id: string) {
    const [result] = await db
      .select()
      .from(learningArtifact)
      .where(eq(learningArtifact.id, id))
      .limit(1);

    return result || null;
  }

  /**
   * Queries a learning artifact matching both ID and workspace ID.
   *
   * @param id - Artifact unique identifier.
   * @param workspaceId - Workspace unique identifier.
   * @returns Learning artifact record or null.
   */
  static async findByIdAndWorkspace(id: string, workspaceId: string) {
    const [result] = await db
      .select()
      .from(learningArtifact)
      .where(
        and(
          eq(learningArtifact.id, id),
          eq(learningArtifact.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    return result || null;
  }

  /**
   * Inserts a new learning artifact record into the database.
   *
   * @param input - Creation payload containing workspaceId, type, title, etc.
   * @returns Newly created learning artifact record.
   */
  static async create(input: CreateLearningArtifactInput) {
    const [newArtifact] = await db
      .insert(learningArtifact)
      .values({
        workspaceId: input.workspaceId,
        type: input.type,
        title: input.title,
        content: input.content || null,
        sourceIds: input.sourceIds || [],
        status: input.status || "PENDING",
        metadata: input.metadata || null,
      })
      .returning();

    return newArtifact;
  }

  /**
   * Updates an existing learning artifact record.
   *
   * @param id - Artifact unique identifier.
   * @param input - Fields to update.
   * @returns Updated artifact record or null.
   */
  static async update(id: string, input: UpdateLearningArtifactInput) {
    const [updated] = await db
      .update(learningArtifact)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(learningArtifact.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Deletes a learning artifact record from the database.
   *
   * @param id - Artifact unique identifier.
   * @returns Deleted artifact record or null.
   */
  static async delete(id: string) {
    const [deleted] = await db
      .delete(learningArtifact)
      .where(eq(learningArtifact.id, id))
      .returning();

    return deleted || null;
  }
}
