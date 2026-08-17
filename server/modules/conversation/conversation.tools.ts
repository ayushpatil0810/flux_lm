import { searchWeb } from "@/lib/firecrawl";
import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "WebSearchTool" });

const searchParameters = z.object({
  query: z.string().describe("The search query to look up on the web."),
});

// The `as any` cast is necessary because this project uses Zod v4 (or a different version)
// which causes a nominal type mismatch with the ai SDK's bundled Zod v3 types,
// leading the compiler to reject the `parameters` schema and fall back to the `execute: undefined` overload.
export const webSearchTool = tool({
  description:
    "Searches the web for up-to-date information, news, or topics that are outside the user's workspace knowledge. Returns detailed markdown content extracted from the best matching search results.",
  parameters: searchParameters,
  execute: async ({ query }: { query: string }) => {
    try {
      // We limit to 3 results to keep the context window reasonable
      const results = await searchWeb(query, 3);

      if (!results || !results.web || results.web.length === 0) {
        return {
          success: false,
          message: `No relevant web results found for: "${query}"`,
        };
      }

      // Format the results cleanly for the LLM
      const formattedResults = results.web
        .map((r: any, index: number) => {
          return `[W${index + 1}] Title: ${r.title}\nURL: ${r.url}\n\n${
            r.markdown || r.content || ""
          }`;
        })
        .join("\n\n---\n\n");

      return {
        success: true,
        results: formattedResults,
      };
    } catch (error) {
      log.error({ error, query }, "Web search tool failed");
      return {
        success: false,
        message: "An error occurred while searching the web.",
      };
    }
  },
} as any);
