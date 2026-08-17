import { ApiError } from "@/server/utils/api-error";
import { ConversationRepository } from "./conversation.repository";
import { CreateConversationInput, AddMessageInput, StreamChatInput } from "./conversation.validator";
import { WorkspaceService } from "../workspace/workspace.service";
import { streamText, convertToModelMessages, type UIMessage, isStepCount, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { CHAT_MODELS, CHAT_MODEL, RECENT_MESSAGE_WINDOW, CONVERSATION_SUMMARY_INTERVAL } from "@/lib/constants";
import { buildChatSystemPrompt, retrieveWorkspaceContext, getLastUserMessageText, buildConversationTitle, getTextFromUIMessage } from "./conversation.utils";
import { webSearchTool } from "./conversation.tools";
import { searchUserMemories, addMemoriesFromMessages } from "@/lib/mem0";
import { inngest } from "@/inngest/client";
import { INNGEST_EVENTS } from "@/inngest/events";

/**
 * Service class encapsulating business logic and rules for Conversation management.
 */
export class ConversationService {
  /**
   * Retrieves all conversations belonging to a specific workspace.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param userId - ID of the requesting user.
   * @returns List of conversation records.
   */
  static async getWorkspaceConversations(workspaceId: string, userId: string) {
    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(workspaceId, userId);
    
    return await ConversationRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * Retrieves a single conversation by ID after checking user access to its workspace.
   *
   * @param id - Conversation unique identifier.
   * @param userId - ID of the user requesting access.
   * @returns Conversation record.
   * @throws {ApiError} 404 Not Found if conversation does not exist or user lacks access.
   */
  static async getConversationById(id: string, userId: string) {
    const conversation = await ConversationRepository.findById(id);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(conversation.workspaceId, userId);

    return conversation;
  }

  /**
   * Creates a new conversation in a workspace.
   *
   * @param userId - ID of the creator.
   * @param input - Validated creation payload.
   * @returns Newly created conversation record.
   */
  static async createConversation(userId: string, input: CreateConversationInput) {
    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    return await ConversationRepository.create(input);
  }

  /**
   * Deletes a conversation after verifying user access.
   *
   * @param id - Conversation unique identifier.
   * @param userId - ID of the user requesting deletion.
   * @returns Deleted conversation record.
   */
  static async deleteConversation(id: string, userId: string) {
    // Verify existence & ownership
    await ConversationService.getConversationById(id, userId);

    return await ConversationRepository.delete(id);
  }

  /**
   * Adds a message to a conversation after verifying user access.
   *
   * @param conversationId - Conversation unique identifier.
   * @param userId - ID of the user adding the message.
   * @param input - Validated message payload.
   * @returns Inserted message record.
   */
  static async addMessage(conversationId: string, userId: string, input: AddMessageInput) {
    // Verify existence & ownership
    await ConversationService.getConversationById(conversationId, userId);

    const result = await ConversationService._insertMessage(conversationId, input);
    const { messageCount: _, ...message } = result;
    return message;
  }

  /**
   * Internal helper to insert a message without redundant workspace checks.
   */
  private static async _insertMessage(conversationId: string, input: AddMessageInput) {
    return await ConversationRepository.addMessage({
      conversationId,
      role: input.role,
      content: input.content,
      citations: input.citations,
    });
  }

  /**
   * Retrieves messages for a conversation after verifying user access.
   *
   * @param conversationId - Conversation unique identifier.
   * @param userId - ID of the user requesting messages.
   * @param limit - Optional limit on the number of returned messages.
   * @returns Array of message records.
   */
  static async getConversationMessages(conversationId: string, userId: string, limit?: number) {
    // Verify existence & ownership
    await ConversationService.getConversationById(conversationId, userId);

    return await ConversationRepository.findMessages(conversationId, limit);
  }

  /**
   * Main RAG chat endpoint logic: streams an AI reply with workspace context and optional web search.
   *
   * @param workspaceId - Workspace whose sources to search
   * @param userId - Authenticated user's id
   * @param input - Client chat payload
   * @returns Streaming Data Response
   */
  static async streamWorkspaceChat(
    workspaceId: string,
    userId: string,
    input: StreamChatInput,
  ) {
    const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
    
    // Find model to use (from input, workspace default, or fallback to CHAT_MODEL)
    const requestedModel = input.model ?? workspace.defaultModel;
    const chatModel = CHAT_MODELS.find((model) => model === requestedModel) ?? CHAT_MODEL;
    
    // Enable web search if requested and tool is available (API keys can be checked inside the tool or implicitly allowed)
    const webSearchEnabled = input.webSearch === true;

    // Cast is necessary because UI message payloads from the client might be broader than the strict SDK UIMessage type
    const userText = getLastUserMessageText(input.messages as unknown as UIMessage[]);
    if (!userText) {
      throw ApiError.badRequest("A user message is required");
    }

    // Resolve or create conversation
    let conversation;
    if (input.conversationId) {
      conversation = await ConversationService.getConversationById(input.conversationId, userId);
    } else {
      conversation = await ConversationService.createConversation(userId, {
        workspaceId,
        title: buildConversationTitle(userText),
      });
    }

    // Save the incoming user message
    await ConversationService._insertMessage(conversation.id, {
      role: "USER",
      content: userText,
    });

    // Parallel fetch RAG context and User Memories
    const [retrievedChunks, userMemories] = await Promise.all([
      retrieveWorkspaceContext(workspaceId, userText),
      searchUserMemories(userId, userText),
    ]);

    const citations = retrievedChunks.map((chunk) => ({
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle,
      sourceType: chunk.sourceType,
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      page: chunk.page,
      excerpt: chunk.text.slice(0, 280),
      score: chunk.score,
    }));

    const systemPrompt = buildChatSystemPrompt({
      chunks: retrievedChunks,
      conversationSummary: conversation.summary || null,
      userMemories: userMemories.map((memory) => memory.memory),
      webSearchEnabled,
    });

    // Provide context window for model
    const contextMessages =
      conversation.summary && input.messages.length > RECENT_MESSAGE_WINDOW
        ? input.messages.slice(-RECENT_MESSAGE_WINDOW)
        : input.messages;

    const tools = webSearchEnabled ? { web_search: webSearchTool } : undefined;

    const result = streamText({
      model: openai(chatModel),
      system: systemPrompt,
      // Cast is necessary because UI message payloads from the client might be broader than the strict SDK UIMessage type
      messages: await convertToModelMessages(contextMessages as unknown as UIMessage[]),
      tools,
      stopWhen: webSearchEnabled ? isStepCount(3) : undefined,
      onFinish: async ({ response, text }) => {
        const assistantText = text.trim();
        if (!assistantText) return;

        // Build citations (if we want to extract web citations we can parse the tool calls, but for simplicity we rely on DB citations)
        // Note: AI SDK v3.x onFinish provides `text`, `toolCalls`, `toolResults` etc.
        const allCitations = [...citations]; 
        
        const addedMessage = await ConversationService._insertMessage(conversation.id, {
          role: "ASSISTANT",
          content: assistantText,
          citations: allCitations.length > 0 ? allCitations : undefined,
        });

        // Update the conversation's title if this is the first real exchange and title is default
        if (conversation.title === "New Chat" || conversation.title === "New chat") {
          await ConversationRepository.update(conversation.id, {
            title: buildConversationTitle(userText),
          });
        }

        // Check if we need to summarize
        const messageCount = addedMessage.messageCount;
        if (messageCount === CONVERSATION_SUMMARY_INTERVAL) {
          await inngest.send({
            name: INNGEST_EVENTS.CONVERSATION_SUMMARIZE,
            data: { conversationId: conversation.id, userId },
          });
        }

      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Conversation-Id": conversation.id,
      },
    });
  }

  /**
   * Summarizes the conversation history and persists the rolling summary.
   * Designed to be called by a background worker (e.g. Inngest).
   *
   * @param conversationId - Conversation to summarize
   * @param userId - ID of the user (for verification)
   */
  static async summarizeConversation(conversationId: string, userId: string) {
    const conversation = await ConversationService.getConversationById(conversationId, userId);
    
    // Use the workspace's default model or fallback
    const workspace = await WorkspaceService.getWorkspaceById(conversation.workspaceId, userId);
    const requestedModel = workspace.defaultModel;
    const chatModel = CHAT_MODELS.find((model) => model === requestedModel) ?? CHAT_MODEL;

    const messages = await ConversationRepository.findMessages(conversationId);
    if (messages.length === 0) return;

    const transcript = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");
    const previousSummary = conversation.summary?.trim();

    const { text: summary } = await generateText({
      model: openai(chatModel),
      system: [
        "You summarize chat conversations for a learning assistant.",
        "Produce a concise rolling summary covering topics discussed, questions asked,",
        "key insights, and unresolved threads.",
        "Write in third person about the user. Keep it under 250 words.",
      ].join("\n"),
      prompt: [
        previousSummary ? `Previous summary:\n${previousSummary}\n` : null,
        "Full conversation transcript:",
        transcript,
        "",
        "Write an updated summary that incorporates new messages.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const updated = await ConversationRepository.updateSummary(
      conversation.id,
      summary.trim()
    );

    const recentMessages = messages.slice(-16).map((message) => ({
      role: message.role.toLowerCase() as "user" | "assistant",
      content: message.content,
    }));

    await addMemoriesFromMessages(userId, recentMessages, {
      source: "learned",
      conversationId,
    });

    return updated;
  }
}
