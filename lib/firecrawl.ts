import { env } from "@/lib/env";
import { Firecrawl } from "firecrawl";

/**
 * Singleton Firecrawl API client initialized with env.FIRECRAWL_API_KEY.
 */
export const firecrawl = new Firecrawl({
  apiKey: env.FIRECRAWL_API_KEY || "",
});

/**
 * Scrapes a single web URL and extracts clean Markdown content and page metadata.
 *
 * @param url - Public web URL to scrape.
 * @returns Object containing extracted markdown, page title, description, and raw metadata.
 */
export async function scrapeUrl(url: string) {
  if (!env.FIRECRAWL_API_KEY) {
    console.warn(
      "[Firecrawl] FIRECRAWL_API_KEY is not configured in env",
    );
  }

  const result = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  return {
    markdown: result.markdown || "",
    title: result.metadata?.title || result.metadata?.ogTitle || url,
    description:
      result.metadata?.description || result.metadata?.ogDescription || "",
    metadata: result.metadata || {},
  };
}

/**
 * Discovers web pages via query search and extracts relevant content.
 *
 * @param query - Search query string.
 * @param limit - Maximum number of search results to return (default 5).
 * @returns Search results containing web page data and markdown content.
 */
export async function searchWeb(query: string, limit = 5) {
  if (!env.FIRECRAWL_API_KEY) {
    console.warn(
      "[Firecrawl] FIRECRAWL_API_KEY is not configured in env",
    );
  }

  const results = await firecrawl.search(query, {
    limit,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
  });

  return results;
}

/**
 * Parses a local or uploaded document file (PDF, DOCX, XLSX, etc.) into clean Markdown.
 *
 * @param file - Object containing data buffer, filename, and optional content type.
 * @returns Parsed markdown, summary, and metadata.
 */
export async function parseDocument(file: {
  data: Buffer | Blob | Uint8Array | ArrayBuffer;
  filename: string;
  contentType?: string;
}) {
  if (!env.FIRECRAWL_API_KEY) {
    console.warn(
      "[Firecrawl] FIRECRAWL_API_KEY is not configured in env",
    );
  }

  const result = await firecrawl.parse(file, {
    formats: ["markdown"],
  });

  return {
    markdown: result.markdown || "",
    summary: result.summary || "",
    metadata: result.metadata || {},
  };
}
