/**
 * Advanced RAG retrieval pipeline built from these stages:
 *
 * 1. **Query Enhancement + HyDE** (one batched LLM call)
 *    - Rewrites the user query into a clean retrieval query.
 *    - Generates a short hypothetical passage (HyDE) that "would answer" the query.
 *
 * 2. **Dual embedding** (parallel)
 *    - Embeds the enhanced query.
 *    - Embeds the HyDE passage.
 *
 * 3. **Dual Pinecone search** (parallel)
 *    - Searches with the enhanced-query vector.
 *    - Searches with the HyDE vector.
 *
 * 4. **RRF Fusion** — Reciprocal Rank Fusion merges the two ranked lists.
 *
 * 5. **Deduplication** — Drops near-duplicate chunks (same source, adjacent indices).
 *
 * Final top-K (`RAG_FINAL_TOP_K`) chunks are returned sorted by fused score.
 */

import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { RAG_CANDIDATE_FETCH_K, RAG_FINAL_TOP_K, RAG_HYDE_MODEL, RAG_MIN_SCORE } from "@/lib/constants";
import { generateEmbedding } from "@/lib/openai";
import { querySimilarity, type ScoredChunkResult } from "@/lib/pinecone";
import { logger } from "@/lib/logger";
import type { RetrievedChunk } from "@/server/modules/conversation/conversation.utils";

const log = logger.child({ module: "RAG" });

// ---------------------------------------------------------------------------
// Step 1 — Query Enhancement + HyDE (single LLM call)
// ---------------------------------------------------------------------------

const queryEnhancementSchema = z.object({
  enhancedQuery: z
    .string()
    .describe(
      "A clear, self-contained retrieval query rewritten from the original user message. Remove conversational filler, expand abbreviations, and make the information need explicit.",
    ),
  hydePassage: z
    .string()
    .describe(
      "A short (2-4 sentence) hypothetical passage that *would* appear in a document answering the query. Write it as if it is an excerpt from a textbook, article, or note.",
    ),
});

type QueryEnhancement = z.infer<typeof queryEnhancementSchema>;

async function enhanceQuery(userQuery: string): Promise<QueryEnhancement> {
  const { output } = await generateText({
    model: openai(RAG_HYDE_MODEL),
    output: Output.object({ schema: queryEnhancementSchema }),
    temperature: 0.2,
    system: [
      "You are a retrieval optimization assistant.",
      "Given a user's question, produce two things:",
      "1. An enhanced retrieval query — clean, specific, self-contained.",
      "2. A hypothetical document passage that would contain the answer.",
      "Be concise. Do not add explanations outside the JSON.",
    ].join("\n"),
    prompt: `User question: ${userQuery}`,
  });

  log.debug({ enhancedQuery: output.enhancedQuery }, "[RAG] query enhanced");
  return output;
}

// ---------------------------------------------------------------------------
// Step 2 — RRF Fusion
// ---------------------------------------------------------------------------

/**
 * Reciprocal Rank Fusion over multiple ranked result lists.
 *
 * @param rankedLists - Arrays of chunk IDs ordered by descending relevance.
 * @param k - RRF smoothing constant (default 60, standard in literature).
 * @returns Map of chunkId → fused score (higher = more relevant).
 */
function rrfFuse(rankedLists: string[][], k = 60): Map<string, number> {
  const scores = new Map<string, number>();

  for (const list of rankedLists) {
    list.forEach((id, rank) => {
      const contribution = 1 / (k + rank + 1);
      scores.set(id, (scores.get(id) ?? 0) + contribution);
    });
  }

  return scores;
}

// ---------------------------------------------------------------------------
// Step 3 — Deduplication
// ---------------------------------------------------------------------------

/**
 * Removes near-duplicate chunks: keeps only the highest-scored chunk when
 * two chunks share the same sourceId and have adjacent chunkIndex values (diff ≤ 1).
 *
 * Operates on a score-sorted list (descending) and greedily keeps the first
 * representative for each (sourceId, chunkGroup) cell.
 */
function deduplicateChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  // Key: `${sourceId}:${Math.floor(chunkIndex / 2)}` — collapses adjacent pairs
  const seen = new Set<string>();
  const result: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const groupKey = `${chunk.sourceId}:${Math.floor(chunk.chunkIndex / 2)}`;
    if (!seen.has(groupKey)) {
      seen.add(groupKey);
      result.push(chunk);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoredResultToChunk(match: ScoredChunkResult): RetrievedChunk | null {
  const meta = match.metadata as Record<string, unknown> | undefined;
  if (
    !meta ||
    typeof meta.sourceId !== "string" ||
    typeof meta.sourceTitle !== "string" ||
    typeof meta.sourceType !== "string" ||
    typeof meta.chunkId !== "string" ||
    typeof meta.text !== "string"
  ) {
    return null;
  }

  return {
    sourceId: meta.sourceId,
    sourceTitle: meta.sourceTitle,
    sourceType: meta.sourceType,
    chunkId: meta.chunkId,
    chunkIndex: Number(meta.chunkIndex ?? 0),
    ...(typeof meta.page === "number" ? { page: meta.page } : {}),
    text: meta.text,
    score: match.score,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Advanced RAG retrieval pipeline.
 *
 * Combines query enhancement, HyDE, dual Pinecone search, RRF fusion, and
 * deduplication to surface the most relevant `RAG_FINAL_TOP_K` chunks.
 *
 * @param workspaceId - Workspace to search within.
 * @param userQuery   - Raw user message text.
 * @param sourceIds   - Optional allowlist of source IDs to restrict search.
 * @returns Ordered array of retrieved chunks (best first).
 */
export async function retrieveWorkspaceContextAdvanced(
  workspaceId: string,
  userQuery: string,
  sourceIds?: string[],
): Promise<RetrievedChunk[]> {
  // --- Step 1: Enhance query + generate HyDE passage (one LLM call) ---
  let enhancement: QueryEnhancement;
  try {
    enhancement = await enhanceQuery(userQuery);
  } catch (err) {
    log.warn({ err }, "[RAG] query enhancement failed, falling back to raw query");
    enhancement = { enhancedQuery: userQuery, hydePassage: userQuery };
  }

  const { enhancedQuery, hydePassage } = enhancement;

  // --- Step 2: Embed both vectors in parallel ---
  const [queryVector, hydeVector] = await Promise.all([
    generateEmbedding(enhancedQuery),
    generateEmbedding(hydePassage),
  ]);

  // --- Step 3: Run both Pinecone searches in parallel ---
  const searchOptions = {
    workspaceId,
    topK: RAG_CANDIDATE_FETCH_K,
    minScore: RAG_MIN_SCORE,
    ...(sourceIds && sourceIds.length > 0 ? { sourceIds } : {}),
  };

  const [queryMatches, hydeMatches] = await Promise.all([
    querySimilarity({ vector: queryVector, ...searchOptions }),
    querySimilarity({ vector: hydeVector, ...searchOptions }),
  ]);

  log.debug(
    { queryMatches: queryMatches.length, hydeMatches: hydeMatches.length },
    "[RAG] search complete",
  );

  // Build a map of chunkId → ScoredChunkResult for merging later
  const chunkById = new Map<string, ScoredChunkResult>();
  for (const match of [...queryMatches, ...hydeMatches]) {
    if (!chunkById.has(match.id)) {
      chunkById.set(match.id, match);
    }
  }

  // --- Step 4: RRF Fusion ---
  const queryRankedIds = queryMatches.map((m) => m.id);
  const hydeRankedIds = hydeMatches.map((m) => m.id);

  const fusedScores = rrfFuse([queryRankedIds, hydeRankedIds]);

  // Sort all unique chunk IDs by fused score descending
  const sortedIds = [...fusedScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  // --- Step 5: Build chunk objects, filter nulls ---
  const fused: RetrievedChunk[] = [];
  for (const id of sortedIds) {
    const match = chunkById.get(id);
    if (!match) continue;
    const chunk = scoredResultToChunk(match);
    if (chunk) {
      // Attach fused score for transparency (overrides raw cosine score)
      chunk.score = fusedScores.get(id) ?? chunk.score;
      fused.push(chunk);
    }
  }

  // --- Step 6: Deduplication then trim to final top-K ---
  const deduped = deduplicateChunks(fused);
  const final = deduped.slice(0, RAG_FINAL_TOP_K);

  log.debug(
    { before: fused.length, afterDedup: deduped.length, final: final.length },
    "[RAG] fusion and dedup complete",
  );

  return final;
}
