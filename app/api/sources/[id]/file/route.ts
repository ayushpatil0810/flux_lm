import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { SourceService } from "@/server/modules/source/source.service";
import { r2Client, getPresignedDownloadUrl } from "@/lib/storage";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "SourceFileRoute" });

/**
 * Handles GET /api/sources/[id]/file
 * Securely streams or redirects to private PDF files stored in Cloudflare R2.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await context.params;

    const source = await SourceService.getSourceById(id, user.id);
    const storageKey = source.metadata?.storageKey as string | undefined;

    if (!storageKey) {
      if (source.url && !source.url.includes(".r2.cloudflarestorage.com")) {
        return NextResponse.redirect(source.url);
      }
      return new NextResponse("File not found", { status: 404 });
    }

    try {
      const bucket =
        (source.metadata?.bucket as string) || env.R2_BUCKET_NAME || "";

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });

      const response = await r2Client.send(command);

      if (!response.Body) {
        const presignedUrl = await getPresignedDownloadUrl(storageKey);
        return NextResponse.redirect(presignedUrl);
      }

      const stream =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.Body as any).transformToWebStream?.() ??
        response.Body;

      return new Response(stream, {
        headers: {
          "Content-Type": response.ContentType || "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(source.title || "document")}.pdf"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (s3Error) {
      log.warn(
        { err: s3Error, sourceId: id },
        "Direct R2 stream failed, attempting presigned URL fallback",
      );
      const presignedUrl = await getPresignedDownloadUrl(storageKey);
      return NextResponse.redirect(presignedUrl);
    }
  } catch (error) {
    log.error({ err: error }, "Failed to serve source file");
    return new NextResponse("Unauthorized or file not found", { status: 404 });
  }
}
