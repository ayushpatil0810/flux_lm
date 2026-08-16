import { scrapeUrl } from "@/lib/firecrawl";
import { parsePdf } from "@/lib/pdf";
import { uploadToStorage } from "@/lib/storage";
import { getYoutubeTranscript } from "@/lib/youtube";
import { WorkspaceService } from "@/server/modules/workspace/workspace.service";
import { ApiError } from "@/server/utils/api-error";
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
    // TODO: Trigger Inngest event for background processing workflow
    // e.g. await inngest.send({ name: "source/process", data: payload });
    console.log(
      `[SourceService] Enqueued background processing for source ID: ${payload.sourceId}`,
    );
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
    } catch (error: any) {
      throw ApiError.badRequest(
        `Failed to scrape website: ${error?.message || "Unknown error"}`,
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
    } catch (error: any) {
      throw ApiError.badRequest(
        `Failed to parse PDF document: ${error?.message || "Unknown error"}`,
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
    } catch (error: any) {
      throw ApiError.badRequest(
        `Failed to fetch YouTube transcript: ${error?.message || "Unknown error"}`,
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
    await SourceService.getSourceById(id, userId);

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

