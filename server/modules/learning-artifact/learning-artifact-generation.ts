import { generateText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { CHAT_MODEL } from "@/lib/constants";
import { SourceRepository } from "@/server/modules/source/source.repository";
import { ApiError } from "@/server/utils/api-error";


const MAX_CONTEXT_CHARS = 120_000;

// Re-declare schemas
const flashcardsSchema = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })).min(3).max(30),
});
const quizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(5),
    correctIndex: z.number().int().min(0),
    explanation: z.string(),
  })).min(3).max(15),
});
const mindmapSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), label: z.string() })).min(2).max(40),
  edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string() })),
});
const takeawaysSchema = z.object({
  items: z.array(z.string()).min(3).max(20),
});
const reportSchema = z.object({
  markdown: z.string(),
  sections: z.array(z.object({ title: z.string(), content: z.string() })),
});

/**
 * Collects and concatenates text from READY workspace sources for artifact generation.
 */
export async function gatherSourceContext(
  workspaceId: string,
  sourceIds?: string[],
) {
  const selected = await SourceRepository.findReadyByWorkspaceId(workspaceId, sourceIds);

  if (selected.length === 0) {
    throw ApiError.badRequest(
      "No ready sources found. Add and process sources before generating learning tools.",
    );
  }

  const withContent = selected.flatMap((src) => {
    const content = typeof src.content === "string" ? src.content.trim() : "";
    return content ? [{ title: src.title, content }] : [];
  });

  if (withContent.length === 0) {
    throw ApiError.badRequest(
      "Selected sources have no extracted content yet.",
    );
  }

  const text = withContent
    .map((src) => `# ${src.title}\n\n${src.content}`)
    .join("\n\n---\n\n")
    .slice(0, MAX_CONTEXT_CHARS);

  return {
    text,
    sourceIds: selected.map((src) => src.id),
  };
}

/**
 * Generates structured or markdown content for a learning artifact using the AI SDK.
 */
type ArtifactType = "SUMMARY" | "TAKEAWAYS" | "FLASHCARDS" | "QUIZ" | "MINDMAP" | "REPORT";

export async function generateArtifactContent(
  type: ArtifactType,
  sourceText: string,
) {
  const system = [
    `You are Chaibook, an expert learning assistant generating a ${type.toLowerCase()} from workspace source materials.`,
    "Use ONLY the provided source content. Do not invent facts not supported by the sources.",
    "Be clear, educational, and well-structured.",
  ].join("\n");

  const prompt = `Source material:\n\n${sourceText}`;

  switch (type) {
    case "SUMMARY": {
      const result = await generateText({
        model: openai(CHAT_MODEL),
        system,
        prompt: `Write a comprehensive markdown summary of the following sources:\n\n${sourceText}`,
      });
      return { markdown: result.text };
    }
    case "TAKEAWAYS": {
      const result = await generateObject({
        model: openai(CHAT_MODEL),
        system,
        schema: takeawaysSchema,
        prompt: `Extract the most important key takeaways as concise bullet points from:\n\n${sourceText}`,
      });
      return result.object;
    }
    case "FLASHCARDS": {
      const result = await generateObject({
        model: openai(CHAT_MODEL),
        system,
        schema: flashcardsSchema,
        prompt: `Create study flashcards (front/back) covering the main concepts from:\n\n${sourceText}`,
      });
      return result.object;
    }
    case "QUIZ": {
      const result = await generateObject({
        model: openai(CHAT_MODEL),
        system,
        schema: quizSchema,
        prompt: `Create a multiple-choice quiz with explanations from:\n\n${sourceText}`,
      });
      return result.object;
    }
    case "MINDMAP": {
      const result = await generateObject({
        model: openai(CHAT_MODEL),
        system,
        schema: mindmapSchema,
        prompt: `Create a mind map as nodes and edges. Use a central topic node and branch out logically from:\n\n${sourceText}`,
      });
      return result.object;
    }
    case "REPORT": {
      const result = await generateObject({
        model: openai(CHAT_MODEL),
        system,
        schema: reportSchema,
        prompt: `Write a structured long-form report with sections and a full markdown version from:\n\n${sourceText}`,
      });
      return result.object;
    }
    default:
      throw ApiError.badRequest(`Unsupported artifact type: ${type}`);
  }
}
