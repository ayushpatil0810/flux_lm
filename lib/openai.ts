import {
  CHAT_MODEL,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "@/lib/constants";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import OpenAI from "openai";

const log = logger.child({ module: "OpenAI" });

/**
 * Singleton OpenAI client instance initialized with env.OPENAI_API_KEY.
 * The SDK will raise an AuthenticationError on the first API call when the key is absent.
 */
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY ?? "",
});

/**
 * Generates a single vector embedding for a text string using OpenAI text-embedding-3-small.
 *
 * @param text - Input text string to embed.
 * @returns Array of floating point numbers (dimension determined by EMBEDDING_DIMENSIONS).
 */
// OpenAI text-embedding-3-* has a strict limit of 8,192 tokens per input (~30,000 chars).
// Clamping to 24,000 chars (~6,000 tokens) safely prevents 400 Bad Request errors on huge chunks.
const MAX_EMBEDDING_CHARS = 24000;

export async function generateEmbedding(text: string): Promise<number[]> {
  const sanitizedText = text.replace(/\n/g, " ").slice(0, MAX_EMBEDDING_CHARS);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    input: sanitizedText,
  });

  return response.data[0].embedding;
}

/**
 * Batch generates vector embeddings for multiple text strings in a single API call.
 *
 * @param texts - Array of input text strings to embed.
 * @returns Array of vector embeddings matching the order of input strings.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const sanitizedInputs = texts.map((t) =>
    t.replace(/\n/g, " ").slice(0, MAX_EMBEDDING_CHARS),
  );

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    input: sanitizedInputs,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Generates a response using OpenAI Chat Completions API.
 *
 * @param messages - OpenAI ChatCompletionMessageParam array.
 * @param options - Optional model override, temperature, and maxTokens.
 * @returns Generated assistant response text content.
 */
export async function generateChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {},
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: options.model || CHAT_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Creates a streaming chat completion response using OpenAI Chat Completions API.
 *
 * @param messages - OpenAI ChatCompletionMessageParam array.
 * @param options - Optional model override and temperature.
 * @returns AsyncIterable stream choices.
 */
export async function streamChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
  } = {},
) {
  return await openai.chat.completions.create({
    model: options.model || CHAT_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    stream: true,
  });
}

if (!env.OPENAI_API_KEY) {
  log.warn(
    "OPENAI_API_KEY is not configured — AI features will fail at runtime",
  );
}
