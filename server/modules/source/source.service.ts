import { chunkPages, chunkText } from "@/lib/chunker";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { scrapeUrl } from "@/lib/firecrawl";
import { generateEmbeddings } from "@/lib/openai";
import { parsePdf } from "@/lib/pdf";
import { deleteVectorsBySourceId, deleteVectorsBySourceIds, upsertVectors } from "@/lib/pinecone";
import { uploadToStorage } from "@/lib/storage";
import { getYoutubeTranscript } from "@/lib/youtube";
import { inngest } from "@/inngest/client";
import { INNGEST_EVENTS } from "@/inngest/events";
import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { ApiError } from "@/server/utils/api-error";
import { SourceChunkRepository } from "./source-chunk.repository";
import { SourceRepository } from "./source.repository";
import {
  BulkDeleteSourcesInput,
  CreateSourceInput,
  ImportPdfSourceInput,
  ImportTextSourceInput,
  ImportWebsiteSourceInput,
  ImportYoutubeSourceInput,
  ListSourcesQuery,
  UpdateSourceInput,
} from "./source.validator";

const log = logger.child({ module: "SourceService" });

/**
 * Returns a user-facing error message that is safe to expose via the API.
 *
 * - In development: appends the raw library error for easier debugging.
 * - In production: returns only the generic public message to avoid leaking
 *   internal infrastructure details (service names, stack traces, etc.).
 *
 * @param error - Caught error from an external library call.
 * @param publicMessage - Safe, generic message to show in all environments.
 */
function sanitizeExternalError(error: unknown, publicMessage: string): string {
  if (env.NODE_ENV !== "production") {
    const detail = error instanceof Error ? error.message : String(error);
    return `${publicMessage}: ${detail}`;
  }
  return publicMessage;
}


/**
 * Service class encapsulating business logic and access control for Source management.
 */
export class SourceService {
  /**
   * Retrieves all sources for a workspace matching optional filters after verifying user ownership.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param userId - Requesting user identifier.
   * @param filters - Optional query filters (type, status, q).
   * @returns Array of source records.
   */
  static async getWorkspaceSources(
    workspaceId: string,
    userId: string,
    filters: Partial<Omit<ListSourcesQuery, "workspaceId">> = {},
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(workspaceId, userId);

    return await SourceRepository.findByWorkspaceId(workspaceId, filters);
  }

  /**
   * Retrieves a single source record by ID after verifying workspace access.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @returns Source record.
   * @throws {ApiError} 404 Not Found if source is not found or access is denied.
   */
  static async getSourceById(id: string, userId: string) {
    const existingSource = await SourceRepository.findById(id);
    if (!existingSource) {
      throw ApiError.notFound("Source not found");
    }

    // Verify workspace access
    await WorkspaceService.getWorkspaceById(existingSource.workspaceId, userId);

    return existingSource;
  }

  /**
   * Enqueues source processing in the background (e.g. via Inngest for AI/RAG workflows: chunking & embeddings).
   *
   * @param payload - Payload containing sourceId and workspaceId.
   */
  static async enqueueSourceProcessing(payload: {
    sourceId: string;
    workspaceId: string;
  }) {
    log.info(
      { sourceId: payload.sourceId },
      "Dispatching Inngest event 'source/created'",
    );

    try {
      await inngest.send({
        name: INNGEST_EVENTS.SOURCE_CREATED,
        data: {
          sourceId: payload.sourceId,
          workspaceId: payload.workspaceId,
        },
      });
    } catch (inngestError) {
      log.warn(
        { err: inngestError, sourceId: payload.sourceId },
        "Failed to send Inngest event, falling back to local async processing",
      );
      // Fallback to local background execution if Inngest is unreachable
      SourceService.processSourcePipeline(payload.sourceId).catch(async (err) => {
        log.error(
          { err, sourceId: payload.sourceId },
          "Processing pipeline failed in local fallback",
        );
        try {
          await SourceService.markSourceFailed(payload.sourceId, err);
        } catch (markErr) {
          log.error(
            { err: markErr, sourceId: payload.sourceId },
            "Failed to mark source as FAILED after fallback error",
          );
        }
      });
    }
  }

  /**
   * Creates a source record with PENDING status and triggers background processing workflow.
   *
   * @param data - Source creation payload.
   * @returns Newly created source record.
   */
  static async createAndProcessSource(data: CreateSourceInput) {
    const sourceRecord = await SourceRepository.create({
      ...data,
      status: data.status || "PENDING",
    });

    await SourceService.enqueueSourceProcessing({
      sourceId: sourceRecord.id,
      workspaceId: sourceRecord.workspaceId,
    });

    return sourceRecord;
  }

  /**
   * Creates a new source after verifying user ownership of the parent workspace.
   *
   * @param userId - Creator user identifier.
   * @param input - Validated source creation payload.
   * @returns Newly created source record.
   */
  static async createSource(userId: string, input: CreateSourceInput) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    return await SourceService.createAndProcessSource(input);
  }

  /**
   * Imports a website source by scraping content from the target URL via Firecrawl
   * and enqueuing background processing.
   *
   * @param userId - Requesting user identifier.
   * @param input - Validated payload containing workspaceId, URL, and optional title.
   * @returns Newly created website source record with PENDING status.
   * @throws {ApiError} If workspace access is denied or website scraping fails.
   */
  static async importWebsiteSource(
    userId: string,
    input: ImportWebsiteSourceInput,
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    let scraped;
    try {
      scraped = await scrapeUrl(input.url);
    } catch (error: unknown) {
      throw ApiError.badRequest(
        sanitizeExternalError(error, "Failed to scrape website"),
      );
    }

    const title = input.title?.trim() || scraped.title || input.url;

    return await SourceService.createAndProcessSource({
      workspaceId: input.workspaceId,
      type: "WEBSITE",
      title,
      content: scraped.markdown,
      url: input.url,
      status: "PENDING",
      metadata: {
        ...scraped.metadata,
        importedFrom: input.url,
        ...(scraped.description ? { description: scraped.description } : {}),
      },
    });
  }

  /**
   * Imports a PDF file source by extracting text locally via unpdf, uploading the PDF binary
   * to Cloudflare R2 storage, and enqueuing background processing workflow.
   *
   * @param userId - Requesting user identifier.
   * @param input - Payload containing workspaceId, file data/filename, and optional title.
   * @returns Newly created PDF source record with PENDING status.
   * @throws {ApiError} If workspace access is denied or PDF parsing fails.
   */
  static async importPdfSource(userId: string, input: ImportPdfSourceInput) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    let parsedPdf;
    try {
      parsedPdf = await parsePdf(input.file.data);
    } catch (error: unknown) {
      throw ApiError.badRequest(
        sanitizeExternalError(error, "Failed to parse PDF document"),
      );
    }

    // Upload raw PDF file to Cloudflare R2 storage bucket
    const fileKey = `workspaces/${input.workspaceId}/pdf/${Date.now()}-${input.file.filename}`;
    const storageResult = await uploadToStorage({
      key: fileKey,
      body: input.file.data,
      contentType: input.file.contentType || "application/pdf",
    });

    const title = input.title?.trim() || input.file.filename;

    return await SourceService.createAndProcessSource({
      workspaceId: input.workspaceId,
      type: "PDF",
      title,
      content: parsedPdf.text,
      url: storageResult.url,
      status: "PENDING",
      metadata: {
        storageKey: storageResult.key,
        bucket: storageResult.bucket,
        originalFilename: input.file.filename,
        totalPages: parsedPdf.totalPages,
      },
    });
  }

  /**
   * Imports a raw text or markdown source and enqueues background processing.
   *
   * @param userId - Requesting user identifier.
   * @param input - Payload containing workspaceId, title, content, and optional type.
   * @returns Newly created source record with PENDING status.
   */
  static async importTextSource(
    userId: string,
    input: ImportTextSourceInput,
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    return await SourceService.createAndProcessSource({
      workspaceId: input.workspaceId,
      type: input.type || "TEXT",
      title: input.title.trim(),
      content: input.content,
      status: "PENDING",
    });
  }

  /**
   * Imports a YouTube video transcript source by fetching transcript segments & video metadata
   * and enqueuing background processing workflow.
   *
   * @param userId - Requesting user identifier.
   * @param input - Payload containing workspaceId, YouTube URL/Video ID, and optional title.
   * @returns Newly created YOUTUBE source record with PENDING status.
   * @throws {ApiError} If workspace access is denied or YouTube transcript fetching fails.
   */
  static async importYoutubeSource(
    userId: string,
    input: ImportYoutubeSourceInput,
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    let ytResult;
    try {
      ytResult = await getYoutubeTranscript(input.url);
    } catch (error: unknown) {
      throw ApiError.badRequest(
        sanitizeExternalError(error, "Failed to fetch YouTube transcript"),
      );
    }

    const title = input.title?.trim() || ytResult.title;

    return await SourceService.createAndProcessSource({
      workspaceId: input.workspaceId,
      type: "YOUTUBE",
      title,
      content: ytResult.transcriptText,
      url: ytResult.videoUrl,
      status: "PENDING",
      metadata: {
        videoId: ytResult.videoId,
        authorName: ytResult.authorName,
        thumbnailUrl: ytResult.thumbnailUrl,
        originalUrl: input.url,
      },
    });
  }

  /**
   * Updates source status to PROCESSING.
   *
   * @param sourceId - Source unique identifier.
   */
  static async markSourceProcessing(sourceId: string) {
    return await SourceRepository.update(sourceId, { status: "PROCESSING" });
  }

  /**
   * Marks a source status as FAILED and records the processing error in metadata.
   *
   * @param sourceId - Source unique identifier.
   * @param error - Caught error object or message.
   * @param existingMetadata - Existing source metadata.
   */
  static async markSourceFailed(
    sourceId: string,
    error: unknown,
    existingMetadata?: unknown,
  ) {
    const message =
      error instanceof Error ? error.message : "Source processing failed";

    const metadata =
      existingMetadata && typeof existingMetadata === "object"
        ? (existingMetadata as Record<string, unknown>)
        : {};

    return await SourceRepository.update(sourceId, {
      status: "FAILED",
      metadata: {
        ...metadata,
        processingError: message,
      },
    });
  }

  /**
   * Step 1 of processing pipeline: Extracts raw text content from a source record.
   *
   * @param sourceId - Source unique identifier.
   */
  static async extractSourceContent(sourceId: string) {
    const sourceRecord = await SourceRepository.findById(sourceId);
    if (!sourceRecord) {
      throw ApiError.notFound("Source not found");
    }

    const text = sourceRecord.content?.trim();
    if (!text) {
      throw ApiError.badRequest(`Source ${sourceId} has no extractable content`);
    }

    const metadata =
      sourceRecord.metadata && typeof sourceRecord.metadata === "object"
        ? (sourceRecord.metadata as Record<string, unknown>)
        : {};

    return {
      sourceId: sourceRecord.id,
      workspaceId: sourceRecord.workspaceId,
      text,
      pages: Array.isArray(metadata.pages)
        ? (metadata.pages as string[])
        : undefined,
      source: sourceRecord,
    };
  }

  /**
   * Step 2 of processing pipeline: Chunks source content into sequential text chunks
   * and persists them in the database.
   *
   * @param sourceId - Source unique identifier.
   * @param text - Full raw document text.
   * @param pages - Optional array of page strings (for multi-page documents).
   */
  static async chunkSourceContent(
    sourceId: string,
    text: string,
    pages?: string[],
  ) {
    await SourceChunkRepository.deleteBySourceId(sourceId);

    const chunks = pages?.length ? chunkPages(pages) : chunkText(text);

    if (chunks.length === 0) {
      throw ApiError.badRequest("No chunks were generated from source content");
    }

    return await SourceChunkRepository.createMany(
      chunks.map((chunk) => ({
        sourceId,
        index: chunk.index,
        content: chunk.content,
        // NOTE: This is a character-length approximation (~4 chars per GPT token).
        // It is stored for informational purposes only and is not used in any
        // context-window or billing logic. For accurate counts, use tiktoken.
        tokenCount: Math.ceil(chunk.content.length / 4),
        metadata: chunk.metadata,
      })),
    );
  }

  /**
   * Step 3 of processing pipeline: Embeds text chunks via OpenAI (in batches of 50),
   * indexes vector embeddings into Pinecone, and updates source status to READY.
   *
   * Storage Architecture Note:
   * Chunk text content is stored in Pinecone vector metadata (`text: chunk.content.slice(0, 35000)`)
   * to eliminate database joins during high-throughput RAG search retrieval.
   * Full source content is retained in PostgreSQL `source.content` for source inspection,
   * artifact generation (summaries/flashcards), and re-chunking/re-processing operations.
   *
   * @param sourceRecord - Parent source record.
   * @param chunks - Array of chunk records saved in database.
   */
  static async embedAndIndexSource(
    sourceRecord: {
      id: string;
      workspaceId: string;
      title: string;
      type: "PDF" | "WEBSITE" | "YOUTUBE" | "TEXT" | "MARKDOWN";
      metadata?: unknown;
    },
    chunks: Array<{
      id: string;
      index: number;
      content: string;
      metadata?: unknown;
    }>,
  ) {

    const batchSize = 50;
    const pineconeItems = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddings(
        batch.map((chunk) => chunk.content),
      );

      for (let j = 0; j < batch.length; j += 1) {
        const chunk = batch[j]!;
        const embedding = embeddings[j]!;
        const chunkMetadata =
          chunk.metadata && typeof chunk.metadata === "object"
            ? (chunk.metadata as Record<string, unknown>)
            : {};

        pineconeItems.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            workspaceId: sourceRecord.workspaceId,
            sourceId: sourceRecord.id,
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            sourceTitle: sourceRecord.title,
            sourceType: sourceRecord.type,
            text: chunk.content.slice(0, 35000),
            ...(typeof chunkMetadata.page === "number"
              ? { page: chunkMetadata.page }
              : {}),
          },
        });
      }
    }

    await upsertVectors(pineconeItems);

    const metadata =
      sourceRecord.metadata && typeof sourceRecord.metadata === "object"
        ? (sourceRecord.metadata as Record<string, unknown>)
        : {};

    return await SourceRepository.update(sourceRecord.id, {
      status: "READY",
      metadata: {
        ...metadata,
        chunkCount: chunks.length,
        indexedAt: new Date().toISOString(),
        processingError: undefined,
      },
    });
  }

  /**
   * Executes complete end-to-end background processing pipeline for a source.
   *
   * @param sourceId - Source unique identifier.
   */
  static async processSourcePipeline(sourceId: string) {
    let sourceRecord;
    try {
      sourceRecord = await SourceRepository.findById(sourceId);
      if (!sourceRecord) throw ApiError.notFound("Source not found");

      await SourceService.markSourceProcessing(sourceId);

      const extracted = await SourceService.extractSourceContent(sourceId);
      const chunks = await SourceService.chunkSourceContent(
        sourceId,
        extracted.text,
        extracted.pages,
      );

      return await SourceService.embedAndIndexSource(sourceRecord, chunks);
    } catch (error) {
      if (sourceRecord) {
        await SourceService.markSourceFailed(
          sourceId,
          error,
          sourceRecord.metadata,
        );
      }
      throw error;
    }
  }

  /**
   * Removes source vectors from Pinecone and deletes chunks from database.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param sourceId - Source unique identifier.
   */
  static async removeSourceFromIndex(workspaceId: string, sourceId: string) {
    await deleteVectorsBySourceId(sourceId);
    await SourceChunkRepository.deleteBySourceId(sourceId);
  }

  /**
   * Removes source vectors from Pinecone and deletes chunks from database for multiple sources in bulk.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param sourceIds - Array of source unique identifiers.
   */
  static async removeSourcesFromIndex(workspaceId: string, sourceIds: string[]) {
    if (sourceIds.length === 0) return;
    await deleteVectorsBySourceIds(sourceIds);
    await SourceChunkRepository.deleteBySourceIds(sourceIds);
  }

  /**
   * Returns all chunks for a source plus total count.
   *
   * @param sourceId - Source unique identifier.
   */
  static async listChunksForSource(sourceId: string) {
    const chunks = await SourceChunkRepository.findBySourceId(sourceId);
    return { chunks, count: chunks.length };
  }

  /**
   * Updates a source record after verifying user ownership.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @param input - Validated update payload.
   * @returns Updated source record.
   */
  static async updateSource(
    id: string,
    userId: string,
    input: UpdateSourceInput,
  ) {
    // Verify existence & workspace access
    await SourceService.getSourceById(id, userId);

    return await SourceRepository.update(id, input);
  }

  /**
   * Deletes a source record after verifying user ownership.
   *
   * @param id - Source unique identifier.
   * @param userId - Requesting user identifier.
   * @returns Deleted source record.
   */
  static async deleteSource(id: string, userId: string) {
    // Verify existence & workspace access
    const existingSource = await SourceService.getSourceById(id, userId);

    await SourceService.removeSourceFromIndex(existingSource.workspaceId, id);

    return await SourceRepository.delete(id);
  }

  /**
   * Bulk deletes multiple sources belonging to a workspace after verifying user ownership.
   *
   * @param userId - Requesting user identifier.
   * @param input - Validated bulk delete payload (workspaceId and ids array).
   * @returns Summary object containing count and deleted IDs.
   */
  static async bulkDeleteSources(
    userId: string,
    input: BulkDeleteSourcesInput,
  ) {
    // Verify workspace access
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    await SourceService.removeSourcesFromIndex(input.workspaceId, input.ids);

    const deleted = await SourceRepository.deleteMany(
      input.workspaceId,
      input.ids,
    );

    return {
      deletedCount: deleted.length,
      deletedIds: deleted.map((s) => s.id),
    };
  }
}

