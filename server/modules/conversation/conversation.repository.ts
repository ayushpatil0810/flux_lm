import { db } from "@/server/db";
import { conversation, message } from "@/server/db/schema";
import { and, desc, eq, count } from "drizzle-orm";

export interface CreateConversationInput {
  workspaceId: string;
  title?: string;
}

export interface AddMessageInput {
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: unknown;
}

/**
 * Repository class managing direct database operations for `conversation` and `message` tables via Drizzle ORM.
 */
export class ConversationRepository {
  /**
   * Retrieves all conversations for a specific workspace ordered by updatedAt descending.
   *
   * @param workspaceId - Workspace unique identifier.
   * @returns Array of conversation records.
   */
  static async findByWorkspaceId(workspaceId: string) {
    return await db
      .select()
      .from(conversation)
      .where(eq(conversation.workspaceId, workspaceId))
      .orderBy(desc(conversation.updatedAt));
  }

  /**
   * Queries a conversation record by unique ID.
   *
   * @param id - Conversation unique identifier.
   * @returns Conversation record or null if not found.
   */
  static async findById(id: string) {
    const [result] = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, id))
      .limit(1);

    return result || null;
  }

  /**
   * Queries a conversation record matching both ID and workspace ID.
   *
   * @param id - Conversation unique identifier.
   * @param workspaceId - Workspace unique identifier.
   * @returns Conversation record or null.
   */
  static async findByIdAndWorkspace(id: string, workspaceId: string) {
    const [result] = await db
      .select()
      .from(conversation)
      .where(
        and(eq(conversation.id, id), eq(conversation.workspaceId, workspaceId)),
      )
      .limit(1);

    return result || null;
  }

  /**
   * Creates a new conversation record.
   *
   * @param input - Creation payload containing workspaceId and optional title.
   * @returns Newly inserted conversation record.
   */
  static async create(input: CreateConversationInput) {
    const [newConv] = await db
      .insert(conversation)
      .values({
        workspaceId: input.workspaceId,
        title: input.title || "New Chat",
      })
      .returning();

    return newConv;
  }

  /**
   * Updates fields of an existing conversation record (e.g. title).
   *
   * @param id - Conversation unique identifier.
   * @param input - Partial conversation fields to update.
   * @returns Updated conversation record or null.
   */
  static async update(
    id: string,
    input: { title?: string; summary?: string },
  ) {
    const [updated] = await db
      .update(conversation)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Updates conversation rolling summary, summary message count, and timestamp.
   *
   * @param id - Conversation unique identifier.
   * @param summary - Rolling summary string.
   * @param summaryMessageCount - Number of messages processed into this summary.
   * @returns Updated conversation record.
   */
  static async updateSummary(
    id: string,
    summary: string,
    summaryMessageCount: number,
  ) {
    const [updated] = await db
      .update(conversation)
      .set({
        summary,
        summaryMessageCount,
        summarizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Deletes a conversation record (cascades to messages).
   *
   * @param id - Conversation unique identifier.
   * @returns Deleted conversation record or null.
   */
  static async delete(id: string) {
    const [deleted] = await db
      .delete(conversation)
      .where(eq(conversation.id, id))
      .returning();

    return deleted || null;
  }

  /**
   * Inserts a message record into a conversation.
   *
   * @param input - Message payload containing conversationId, role, content, citations.
   * @returns Inserted message record.
   */
  static async addMessage(input: AddMessageInput) {
    const [newMsg] = await db
      .insert(message)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        citations: input.citations || null,
      })
      .returning();

    // Touch conversation updatedAt timestamp
    await db
      .update(conversation)
      .set({ updatedAt: new Date() })
      .where(eq(conversation.id, input.conversationId));

    return newMsg;
  }

  /**
   * Retrieves messages belonging to a conversation ordered by createdAt ascending.
   *
   * @param conversationId - Conversation unique identifier.
   * @param limit - Optional maximum number of recent messages to return.
   * @returns Array of message records.
   */
  static async findMessages(conversationId: string, limit?: number) {
    const query = db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.createdAt));

    if (limit) {
      const recentMessages = await query.limit(limit);
      return recentMessages.reverse();
    }

    const messages = await query;
    return messages.reverse();
  }

  /**
   * Retrieves messages by conversation ID.
   * Alias for findMessages.
   * 
   * @param conversationId - Conversation unique identifier.
   * @param limit - Optional maximum number of recent messages to return.
   * @returns Array of message records.
   */
  static async findMessagesByConversationId(conversationId: string, limit?: number) {
    return this.findMessages(conversationId, limit);
  }

  /**
   * Counts the number of messages in a conversation.
   *
   * @param conversationId - Conversation unique identifier.
   * @returns The total number of messages.
   */
  static async countMessagesByConversationId(conversationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(message)
      .where(eq(message.conversationId, conversationId));

    return result?.count || 0;
  }

  /**
   * Creates a message record.
   * Alias for addMessage.
   * 
   * @param input - Message payload.
   * @returns Inserted message record.
   */
  static async createMessageRecord(input: AddMessageInput) {
    return this.addMessage(input);
  }
}
