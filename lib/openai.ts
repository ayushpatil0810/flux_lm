import { CHAT_MODEL, EMBEDDING_MODEL } from "@/lib/constants";
import { env } from "@/lib/env";
import OpenAI from "openai";

/**
 * Singleton OpenAI client instance initialized with env.OPENAI_API_KEY.
 */
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || "",
});

/**
 * Generates a single vector embedding (1536 dimensions) for a text string using OpenAI text-embedding-3-small.
 *
 * @param text - Input text string to embed.
 * @returns Array of 1536 floating point numbers.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!env.OPENAI_API_KEY) {
    console.warn("[OpenAI] OPENAI_API_KEY is not configured in env");
  }

  const sanitizedText = text.replace(/\n/g, " ");

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
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
  if (!env.OPENAI_API_KEY) {
    console.warn("[OpenAI] OPENAI_API_KEY is not configured in env");
  }

  const sanitizedInputs = texts.map((t) => t.replace(/\n/g, " "));

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
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
  if (!env.OPENAI_API_KEY) {
    console.warn("[OpenAI] OPENAI_API_KEY is not configured in env");
  }

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
  if (!env.OPENAI_API_KEY) {
    console.warn("[OpenAI] OPENAI_API_KEY is not configured in env");
  }

  return await openai.chat.completions.create({
    model: options.model || CHAT_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    stream: true,
  });
}
