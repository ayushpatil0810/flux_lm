import { env } from "@/lib/env";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = env.R2_PUBLIC_URL || "";

const endpoint =
  env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "http://localhost:9000");

/**
 * Singleton AWS S3 Client configured for Cloudflare R2 storage.
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadFileOptions {
  key: string;
  body: Buffer | Uint8Array | Blob | ArrayBuffer;
  contentType: string;
}

/**
 * Uploads a file buffer or binary data to Cloudflare R2 bucket.
 *
 * @param options - Object with storage key, file body, and content type.
 * @returns Object with key, url, and bucket name.
 */
export async function uploadToStorage({
  key,
  body,
  contentType,
}: UploadFileOptions) {
  if (!R2_BUCKET_NAME) {
    console.warn(
      "[Storage] R2_BUCKET_NAME is not configured in env",
    );
  }

  // Convert ArrayBuffer to Buffer if needed
  const bodyBuffer =
    body instanceof ArrayBuffer ? Buffer.from(body) : (body as Buffer | Uint8Array);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: bodyBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
    : `${endpoint}/${R2_BUCKET_NAME}/${key}`;

  return {
    key,
    url: publicUrl,
    bucket: R2_BUCKET_NAME,
  };
}

/**
 * Generates a presigned GET URL for downloading or viewing a private file from R2.
 *
 * @param key - Storage object key.
 * @param expiresIn - URL expiration time in seconds (default 3600 = 1 hr).
 * @returns Presigned download URL string.
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 *
 * @param key - Storage object key.
 */
export async function deleteFromStorage(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await r2Client.send(command);
}
