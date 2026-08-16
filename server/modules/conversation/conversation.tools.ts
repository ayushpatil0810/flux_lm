import { searchWeb } from "@/lib/firecrawl";
import { tool } from "ai";
import { z } from "zod";

export const webSearchTool = tool({
  description:
    "Searches the web for up-to-date information, news, or topics that are outside the user's workspace knowledge. Returns detailed markdown content extracted from the best matching search results.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web."),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      // We limit to 3 results to keep the context window reasonable
      const results = (await searchWeb(query, 3)) as any;

      if (!results) {
        return {
          success: false,
          message: `No relevant web results found for: "${query}"`,
        };
      }

      const resultsArray = results.data || results.web || [];

      if (resultsArray.length === 0) {
        return {
          success: false,
          message: `No relevant web results found for: "${query}"`,
        };
      }

      // Format the results cleanly for the LLM
      const formattedResults = resultsArray
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
      console.error("Web search tool failed:", error);
      return {
        success: false,
        message: "An error occurred while searching the web.",
      };
    }
  },
} as any);
