import { logger } from "@/lib/logger";
import { SourceChunkRepository } from "@/server/modules/source/source-chunk.repository";
import { SourceRepository } from "@/server/modules/source/source.repository";
import { SourceService } from "@/server/modules/source/source.service";
import { ApiError } from "@/server/utils/api-error";
import { ConversationService } from "@/server/modules/conversation/conversation.service";
import { inngest } from "./client";

const log = logger.child({ module: "Inngest" });


/**
 * Step-by-step durable function for source ingestion: content extraction, chunking,
 * OpenAI vector embeddings generation, and Pinecone index storage.
 */
export const processSourceFunction = inngest.createFunction(
  {
    id: "process-source",
    retries: 3,
    triggers: [{ event: "source/created" }],
  },
  async ({ event, step }) => {
    const { sourceId } = event.data as { sourceId: string; workspaceId?: string };

    await step.run("mark-processing", () =>
      SourceService.markSourceProcessing(sourceId),
    );

    try {
      const extracted = await step.run("extract-content", () =>
        SourceService.extractSourceContent(sourceId),
      );

      await step.run("chunk-content", () =>
        SourceService.chunkSourceContent(
          sourceId,
          extracted.text,
          extracted.pages,
        ),
      );

      const result = await step.run("embed-and-index", async () => {
        const source = await SourceRepository.findById(sourceId);
        if (!source) {
          throw ApiError.notFound("Source not found");
        }

        const chunks = await SourceChunkRepository.findBySourceId(sourceId);
        await SourceService.embedAndIndexSource(source, chunks);

        return { chunkCount: chunks.length };
      });

      return { sourceId, status: "READY", ...result };
    } catch (error) {
      await step.run("mark-failed", async () => {
        const source = await SourceRepository.findById(sourceId);
        if (source) {
          await SourceService.markSourceFailed(sourceId, error, source.metadata);
        }
      });
      throw error;
    }
  },
);

/**
 * Inngest function for asynchronous learning artifact generation (summaries, flashcards, mindmaps).
 */
export const generateArtifactFunction = inngest.createFunction(
  {
    id: "generate-artifact",
    retries: 2,
    triggers: [{ event: "artifact/generate" }],
  },
  async ({ event, step }) => {
    const { artifactId } = event.data as { artifactId: string };

    await step.run("generate", async () => {
      log.info({ artifactId }, "Processing learning artifact generation");
      const { LearningArtifactService } = await import(
        "@/server/modules/learning-artifact/learning-artifact.service"
      );
      await LearningArtifactService.processArtifactById(artifactId);
      return { artifactId };
    });

    return { artifactId, status: "READY" };
  },
);

/**
 * Inngest function for rolling conversation memory summarization.
 */
export const summarizeConversationFunction = inngest.createFunction(
  {
    id: "summarize-conversation",
    retries: 2,
    triggers: [{ event: "conversation/summarize" }],
  },
  async ({ event, step }) => {
    const { conversationId, userId } = event.data as {
      conversationId: string;
      userId: string;
    };

    await step.run("summarize", async () => {
      log.info({ conversationId, userId }, "Summarizing conversation memory");
      await ConversationService.summarizeConversation(conversationId, userId);
      return { conversationId };
    });

    return { conversationId, status: "SUMMARIZED" };
  },
);

/** Array of all Inngest functions registered with the serve endpoint. */
export const functions = [
  processSourceFunction,
  generateArtifactFunction,
  summarizeConversationFunction,
];
