import { SourceRepository } from "@/server/modules/source/source.repository";
import { SourceService } from "@/server/modules/source/source.service";
import { ApiError } from "@/server/utils/api-error";
import { inngest } from "./client";

/**
 * Inngest durable function for background RAG source processing.
 * Chains content extraction, chunking, OpenAI embeddings generation, and Pinecone vector indexing.
 */
export const processSourceFunction = inngest.createFunction(
  {
    id: "process-source-pipeline",
    name: "Process Source RAG Pipeline",
    triggers: [{ event: "source/process" }],
    onFailure: async ({ event, error }) => {
      const sourceId = (event.data.event as any)?.data?.sourceId;
      if (sourceId) {
        await SourceService.markSourceFailed(sourceId, error);
      }
    },
  },
  async ({ event, step }) => {
    const { sourceId } = event.data as { sourceId: string; workspaceId: string };

    // Step 1: Mark source status as PROCESSING
    await step.run("mark-processing", async () => {
      return await SourceService.markSourceProcessing(sourceId);
    });

    // Step 2: Extract raw source content
    const extracted = await step.run("extract-content", async () => {
      return await SourceService.extractSourceContent(sourceId);
    });

    // Step 3: Chunk content into text segments
    const chunks = await step.run("chunk-content", async () => {
      return await SourceService.chunkSourceContent(
        sourceId,
        extracted.text,
        extracted.pages,
      );
    });

    // Step 4: Embed text chunks via OpenAI and index into Pinecone vector storage
    await step.run("embed-and-index", async () => {
      const sourceRecord = await SourceRepository.findById(sourceId);
      if (!sourceRecord) {
        throw ApiError.notFound("Source not found");
      }
      return await SourceService.embedAndIndexSource(sourceRecord, chunks as any);
    });

    return {
      success: true,
      sourceId,
      indexedChunks: chunks.length,
    };
  },
);
