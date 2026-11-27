import { Supadata } from "@supadata/js";
import { YtCaptionKit } from "yt-caption-kit";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const log = logger.child({ module: "YouTube" });

export interface YoutubeTranscriptResult {
  videoId: string;
  videoUrl: string;
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
  transcriptText: string;
}

/**
 * Extracts 11-character YouTube video ID from various URL formats or raw video ID strings.
 *
 * @param urlOrId - YouTube URL or 11-character Video ID.
 * @returns Extracted 11-character YouTube Video ID.
 */
function extractYoutubeVideoId(urlOrId: string): string {
  const trimmed = urlOrId.trim();

  // If it's already an 11-character string without slashes or query params
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL regex
  const regExp =
    /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  throw new Error("Invalid YouTube URL or Video ID format");
}

/**
 * Formats offset seconds into [MM:SS] or [HH:MM:SS] timestamp string.
 *
 * @param offsetInSeconds - Offset time in seconds.
 */
function formatTimestamp(offsetInSeconds: number): string {
  const totalSeconds = Math.floor(offsetInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, "0");

  if (hours > 0) {
    return `[${pad(hours)}:${pad(minutes)}:${pad(seconds)}]`;
  }
  return `[${pad(minutes)}:${pad(seconds)}]`;
}

/**
 * Fetches video metadata (title, author, thumbnail) via free YouTube oEmbed API.
 *
 * @param videoId - 11-character YouTube Video ID.
 */
async function fetchYoutubeMetadata(videoId: string) {
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;

  try {
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      return {
        title: data.title || `YouTube Video (${videoId})`,
        authorName: data.author_name || "",
        thumbnailUrl:
          data.thumbnail_url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch (error) {
    log.warn({ err: error, videoId }, "Failed to fetch oEmbed metadata");
  }

  return {
    title: `YouTube Video (${videoId})`,
    authorName: "",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

/**
 * Fetches transcript via Supadata managed API — works reliably from cloud/Vercel IPs.
 * Supadata offsets are in milliseconds.
 *
 * @param videoId - 11-character YouTube Video ID.
 */
async function fetchTranscriptViaSupadata(videoId: string): Promise<string> {
  const supadata = new Supadata({ apiKey: env.SUPADATA_API_KEY! });
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const result = await supadata.transcript({ url: videoUrl });

  // For long videos Supadata returns a JobId instead of the transcript directly.
  // Poll until complete (max ~30s).
  let transcript;
  if ("jobId" in result) {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const job = await supadata.transcript.getJobStatus(result.jobId);
      if (job.status === "completed" && job.result) {
        transcript = job.result;
        break;
      }
      if (job.status === "failed") {
        throw new Error("Supadata transcript job failed");
      }
    }
    if (!transcript) {
      throw new Error("Supadata transcript job timed out");
    }
  } else {
    transcript = result;
  }

  if (!transcript.content || transcript.content.length === 0) {
    throw new Error("No transcript found for this YouTube video.");
  }

  // Supadata returns an array of { text, offset (ms), duration (ms) }
  return (transcript.content as Array<{ text: string; offset: number }>)
    .map((item) => {
      const timeStr = formatTimestamp(item.offset / 1000);
      return `${timeStr} ${item.text.trim()}`;
    })
    .join("\n");
}

/**
 * Fetches transcript via yt-caption-kit — works on local/residential IPs only,
 * NOT reliable from cloud providers (AWS/GCP/Vercel).
 *
 * @param videoId - 11-character YouTube Video ID.
 */
async function fetchTranscriptViaLocal(videoId: string): Promise<string> {
  const api = new YtCaptionKit();
  const transcript = await api.fetch(videoId, { languages: ["en"] });

  if (!transcript || transcript.length === 0) {
    throw new Error("No transcript found for this YouTube video.");
  }

  // yt-caption-kit returns `start` in seconds
  return transcript.snippets
    .map((item) => {
      const timeStr = formatTimestamp(item.start);
      return `${timeStr} ${item.text.trim()}`;
    })
    .join("\n");
}

/**
 * Fetches transcript for a YouTube video and formats it into clean timestamped Markdown.
 *
 * Strategy:
 * - If SUPADATA_API_KEY is set → use Supadata (works from Vercel/cloud IPs).
 * - Otherwise → fall back to local yt-caption-kit (works only from non-cloud IPs).
 *
 * @param urlOrId - YouTube URL or Video ID.
 * @returns Formatted transcript text and metadata.
 */
export async function getYoutubeTranscript(
  urlOrId: string,
): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(urlOrId);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const [metadata, transcriptText] = await Promise.all([
    fetchYoutubeMetadata(videoId),
    env.SUPADATA_API_KEY
      ? fetchTranscriptViaSupadata(videoId)
      : fetchTranscriptViaLocal(videoId),
  ]);

  return {
    videoId,
    videoUrl,
    title: metadata.title,
    authorName: metadata.authorName,
    thumbnailUrl: metadata.thumbnailUrl,
    transcriptText,
  };
}
