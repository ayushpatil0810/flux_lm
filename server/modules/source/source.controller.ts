import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { SourceService } from "./source.service";
import {
  bulkDeleteSourcesSchema,
  createSourceSchema,
  importTextSourceSchema,
  importWebsiteSourceSchema,
  importYoutubeSourceSchema,
  listSourcesQuerySchema,
  updateSourceSchema,
} from "./source.validator";

/**
 * Controller class handling HTTP requests for Source operations.
 */
export class SourceController {
  /**
   * Helper method to retrieve the authenticated user from session headers.
   *
   * @param req - Incoming NextRequest object.
   * @returns Authenticated user.
   * @throws {ApiError} 401 Unauthorized if authentication fails.
   */
  private static async getAuthenticatedUser(req: NextRequest) {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    return session.user;
  }

  /**
   * Handles GET /api/sources?workspaceId=...&type=...&status=...&q=...
   * Fetches sources for a specific workspace with optional filtering and search.
   */
  static listSources = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      workspaceId: searchParams.get("workspaceId") || undefined,
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      q: searchParams.get("q") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    };

    const validation = listSourcesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const { workspaceId, ...filters } = validation.data;

    const sources = await SourceService.getWorkspaceSources(
      workspaceId,
      user.id,
      filters,
    );
    return ApiResponse.success(sources);
  });

  /**
   * Handles GET /api/sources/[id]
   * Fetches a single source by ID.
   */
  static getSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      const src = await SourceService.getSourceById(id, user.id);
      return ApiResponse.success(src);
    },
  );

  /**
   * Handles POST /api/sources
   * Creates a new source.
   */
  static createSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const newSource = await SourceService.createSource(user.id, validation.data);
    return ApiResponse.created(newSource, "Source created successfully");
  });

  /**
   * Handles POST /api/sources/import/website
   * Imports a website source by scraping content from a URL via Firecrawl.
   */
  static importWebsiteSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = importWebsiteSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const imported = await SourceService.importWebsiteSource(
      user.id,
      validation.data,
    );
    return ApiResponse.created(
      imported,
      "Website source imported successfully",
    );
  });

  /**
   * Handles POST /api/sources/import/pdf
   * Imports a PDF file source by parsing text and uploading binary to Cloudflare R2.
   */
  static importPdfSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;
    const title = (formData.get("title") as string | null) || undefined;

    if (!file) {
      throw ApiError.badRequest("PDF file is required");
    }

    if (!workspaceId) {
      throw ApiError.badRequest("Workspace ID is required");
    }

    // Validate file size: reject files over 20 MB before reading them into memory
    const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX_PDF_BYTES) {
      throw ApiError.badRequest("PDF file must be smaller than 20 MB");
    }

    // Validate MIME type — browser-reported type only; unpdf will reject non-PDF bytes
    const ALLOWED_MIME_TYPES = ["application/pdf"];
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      throw ApiError.badRequest("Only PDF files are accepted");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imported = await SourceService.importPdfSource(user.id, {
      workspaceId,
      title,
      file: {
        data: buffer,
        filename: file.name,
        contentType: file.type || "application/pdf",
      },
    });

    return ApiResponse.created(
      imported,
      "PDF source imported successfully",
    );
  });

  /**
   * Handles POST /api/sources/import/text
   * Imports a raw text or markdown source.
   */
  static importTextSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = importTextSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const imported = await SourceService.importTextSource(
      user.id,
      validation.data,
    );
    return ApiResponse.created(
      imported,
      "Text source imported successfully",
    );
  });

  /**
   * Handles POST /api/sources/import/youtube
   * Imports a YouTube video transcript source.
   */
  static importYoutubeSource = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = importYoutubeSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const imported = await SourceService.importYoutubeSource(
      user.id,
      validation.data,
    );
    return ApiResponse.created(
      imported,
      "YouTube source imported successfully",
    );
  });

  /**
   * Handles PATCH /api/sources/[id]
   * Updates an existing source.
   */
  static updateSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      const body = await req.json();

      const validation = updateSourceSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const updated = await SourceService.updateSource(
        id,
        user.id,
        validation.data,
      );
      return ApiResponse.success(updated, "Source updated successfully");
    },
  );

  /**
   * Handles DELETE /api/sources/[id]
   * Deletes a single source.
   */
  static deleteSource = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await SourceController.getAuthenticatedUser(req);
      const { id } = await params;
      await SourceService.deleteSource(id, user.id);
      return ApiResponse.success(null, "Source deleted successfully");
    },
  );

  /**
   * Handles DELETE /api/sources
   * Bulk deletes multiple sources for a workspace.
   */
  static bulkDeleteSources = asyncHandler(async (req: NextRequest) => {
    const user = await SourceController.getAuthenticatedUser(req);
    const body = await req.json();

    const validation = bulkDeleteSourcesSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const result = await SourceService.bulkDeleteSources(
      user.id,
      validation.data,
    );
    return ApiResponse.success(result, "Sources deleted successfully");
  });
}
