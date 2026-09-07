import { logger } from "@/lib/logger";
import { YoutubeTranscript } from "youtube-transcript";

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
 * Detects whether transcript item offsets and durations are returned in milliseconds
 * (standard for modern YouTube srv3 format) or seconds (classic fallback format).
 */
function isTranscriptInMilliseconds(
  items: Array<{ offset: number; duration?: number }>,
): boolean {
  if (items.length === 0) return false;

  // 1. Any subtitle segment duration > 60 is definitively in milliseconds
  // (a single spoken caption line is virtually never > 60 seconds).
  if (items.some((item) => (item.duration ?? 0) > 60)) {
    return true;
  }

  // 2. Any offset > 43,200 (12 hours) is definitively in milliseconds.
  if (items.some((item) => item.offset > 43200)) {
    return true;
  }

  // 3. Check positive gaps between consecutive items.
  // In spoken dialog, consecutive captions occur 1 to 10 seconds apart.
  // In milliseconds, those gaps are 1,000 to 10,000 ms.
  if (items.length > 1) {
    let positiveGaps = 0;
    let msGaps = 0;
    for (let i = 1; i < items.length; i++) {
      const diff = items[i].offset - items[i - 1].offset;
      if (diff > 0) {
        positiveGaps++;
        if (diff > 100) {
          msGaps++;
        }
      }
    }
    if (positiveGaps > 0 && msGaps / positiveGaps > 0.5) {
      return true;
    }
  }

  // 4. Fallback for single item: offset >= 1000 means milliseconds.
  if (items.some((item) => item.offset >= 1000)) {
    return true;
  }

  return false;
}

/**
 * Fetches transcript for a YouTube video and formats it into clean timestamped Markdown.
 *
 * @param urlOrId - YouTube URL or Video ID.
 * @returns Formatted transcript text and metadata.
 */
export async function getYoutubeTranscript(
  urlOrId: string,
): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(urlOrId);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const [metadata, transcriptItems] = await Promise.all([
    fetchYoutubeMetadata(videoId),
    YoutubeTranscript.fetchTranscript(videoId),
  ]);

  if (!transcriptItems || transcriptItems.length === 0) {
    throw new Error("No transcript found for this YouTube video.");
  }

  const isMs = isTranscriptInMilliseconds(transcriptItems);

  // Format segments into timestamped markdown: [00:15] Text snippet...
  const formattedTranscript = transcriptItems
    .map((item) => {
      const offsetSeconds = isMs ? item.offset / 1000 : item.offset;
      const timeStr = formatTimestamp(offsetSeconds);
      return `${timeStr} ${item.text.trim()}`;
    })
    .join("\n");

  return {
    videoId,
    videoUrl,
    title: metadata.title,
    authorName: metadata.authorName,
    thumbnailUrl: metadata.thumbnailUrl,
    transcriptText: formattedTranscript,
  };
}
