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
export function extractYoutubeVideoId(urlOrId: string): string {
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
export function formatTimestamp(offsetInSeconds: number): string {
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
export async function fetchYoutubeMetadata(videoId: string) {
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

  // Format segments into timestamped markdown: [00:15] Text snippet...
  const formattedTranscript = transcriptItems
    .map((item) => {
      const offsetSeconds =
        item.offset > 100000 ? item.offset / 1000 : item.offset;
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
