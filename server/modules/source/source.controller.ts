import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { checkRateLimit } from "@/server/utils/rate-limiter";
import { SourceService } from "./source.service";
import { SUPPORTED_EXTENSIONS, getExtension } from "@/lib/file-parser";
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
   * Handles GET /api/sources?workspaceId=...&type=...&status=...&q=...

   * Fetches sources for a specific workspace with optional filtering and search.
   */
  static listSources = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
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
      const user = await getAuthenticatedUser(req);
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
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createSourceSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const newSource = await SourceService.createSource(
      user.id,
      validation.data,
    );
    return ApiResponse.created(newSource, "Source created successfully");
  });

  /**
   * Handles POST /api/sources/import/website
   * Imports a website source by scraping content from a URL via Firecrawl.
   */
  static importWebsiteSource = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    await checkRateLimit(`source_import:${user.id}`, {
      maxRequests: 15,
      windowMs: 60 * 1000,
    });
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
   * Handles POST /api/sources/import/file
   * Imports a document file (txt, md, docx, pptx, xlsx) by parsing text and
   * uploading the binary to Cloudflare R2.
   */
  static importFileSource = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    await checkRateLimit(`source_import:${user.id}`, {
      maxRequests: 15,
      windowMs: 60 * 1000,
    });
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;
    const title = (formData.get("title") as string | null) || undefined;

    if (!file) {
      throw ApiError.badRequest("File is required");
    }

    if (!workspaceId) {
      throw ApiError.badRequest("Workspace ID is required");
    }

    const extension = getExtension(file.name);

    if (!SUPPORTED_EXTENSIONS.includes(extension as never)) {
      throw ApiError.badRequest(
        `Unsupported file type ".${extension}". Supported types: ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}`,
      );
    }

    const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_FILE_BYTES) {
      throw ApiError.badRequest("File size must be smaller than 50 MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imported = await SourceService.importFileSource(user.id, {
      workspaceId,
      title,
      extension,
      file: {
        data: buffer,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      },
    });

    return ApiResponse.created(imported, "File source imported successfully");
  });

  /**
   * Handles POST /api/sources/import/text
   * Imports a raw text or markdown source.
   */
  static importTextSource = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    await checkRateLimit(`source_import:${user.id}`, {
      maxRequests: 15,
      windowMs: 60 * 1000,
    });
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
    return ApiResponse.created(imported, "Text source imported successfully");
  });

  /**
   * Handles POST /api/sources/import/youtube
   * Imports a YouTube video transcript source.
   */
  static importYoutubeSource = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    await checkRateLimit(`source_import:${user.id}`, {
      maxRequests: 15,
      windowMs: 60 * 1000,
    });
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
      const user = await getAuthenticatedUser(req);
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
      const user = await getAuthenticatedUser(req);
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
    const user = await getAuthenticatedUser(req);
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
