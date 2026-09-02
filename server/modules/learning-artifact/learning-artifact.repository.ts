import { db } from "@/server/db";
import {
  learningArtifact,
  LearningArtifactContent,
  LearningArtifactMetadata,
} from "@/server/db/schema";
import { and, desc, eq, type InferSelectModel } from "drizzle-orm";

type ArtifactRecord = InferSelectModel<typeof learningArtifact>;

export interface CreateLearningArtifactInput {
  workspaceId: string;
  type: ArtifactRecord["type"];
  title: string;
  content?: LearningArtifactContent;
  sourceIds?: string[];
  status?: ArtifactRecord["status"];
  metadata?: LearningArtifactMetadata;
}

export interface UpdateLearningArtifactInput {
  title?: string;
  content?: LearningArtifactContent;
  status?: ArtifactRecord["status"];
  metadata?: LearningArtifactMetadata;
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
    filters: {
      type?: ArtifactRecord["type"];
      status?: ArtifactRecord["status"];
    } = {},
  ) {
    const conditions = [eq(learningArtifact.workspaceId, workspaceId)];

    if (filters.type) {
      conditions.push(eq(learningArtifact.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(learningArtifact.status, filters.status));
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
