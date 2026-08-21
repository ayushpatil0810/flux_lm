import { RAG_MIN_SCORE, RAG_TOP_K } from "@/lib/constants";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";

const log = logger.child({ module: "Pinecone" });

/**
 * Singleton Pinecone Client instance initialized with env.PINECONE_API_KEY.
 */
export const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY ?? "",
});

/**
 * Retrieves the configured Pinecone Index instance.
 *
 * @returns Pinecone Index object.
 */
export function getPineconeIndex() {
  const indexName = env.PINECONE_INDEX || "flux";
  return pinecone.index(indexName);
}

export interface PineconeVectorItem {
  id: string;
  values: number[];
  metadata: {
    workspaceId: string;
    sourceId: string;
    chunkIndex: number;
    text: string;
    page?: number;
    [key: string]: unknown;
  };
}

/**
 * Upserts a batch of vector embeddings with metadata into Pinecone index.
 *
 * @param vectors - Array of vector objects containing id, values (dim based on EMBEDDING_DIMENSIONS), metadata.
 * @param namespace - Optional namespace (defaults to workspaceId or default namespace).
 */
export async function upsertVectors(
  vectors: PineconeVectorItem[],
  namespace?: string,
) {
  if (vectors.length === 0) return;
  if (!env.PINECONE_API_KEY) {
    log.warn("PINECONE_API_KEY is not configured — skipping vector upsert");
    return;
  }

  const index = getPineconeIndex();
  const targetIndex = namespace ? index.namespace(namespace) : index;

  // Upsert in batches of 100 to prevent payload size limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await targetIndex.upsert({
      records: batch.map((v) => ({
        id: v.id,
        values: v.values,
        metadata: v.metadata as RecordMetadata,
      })),
    });
  }
}

export interface VectorQueryOptions {
  vector: number[];
  workspaceId: string;
  sourceIds?: string[];
  topK?: number;
  minScore?: number;
  namespace?: string;
}

export interface ScoredChunkResult {
  id: string;
  score: number;
  metadata: {
    workspaceId: string;
    sourceId: string;
    chunkIndex: number;
    text: string;
    page?: number;
    [key: string]: unknown;
  };
}

/**
 * Performs vector similarity search in Pinecone filtering by workspaceId and optional sourceIds.
 *
 * @param options - Query parameters containing vector embedding, workspaceId, topK, minScore.
 * @returns Array of matching chunks with similarity score above minScore.
 */
export async function querySimilarity(
  options: VectorQueryOptions,
): Promise<ScoredChunkResult[]> {
  if (!env.PINECONE_API_KEY) {
    log.warn("PINECONE_API_KEY is not configured — returning empty similarity results");
    return [];
  }

  const index = getPineconeIndex();
  const targetIndex = options.namespace
    ? index.namespace(options.namespace)
    : index;

  const topK = options.topK ?? RAG_TOP_K;
  const minScore = options.minScore ?? RAG_MIN_SCORE;

  // Metadata filter for workspace & optional source filters
  const filter: Record<string, unknown> = {
    workspaceId: { $eq: options.workspaceId },
  };

  if (options.sourceIds && options.sourceIds.length > 0) {
    filter.sourceId = { $in: options.sourceIds };
  }

  const queryResponse = await targetIndex.query({
    vector: options.vector,
    topK,
    includeMetadata: true,
    filter: filter as RecordMetadata,
  });

  const matches = queryResponse.matches || [];

  return matches
    .filter((match) => (match.score ?? 0) >= minScore)
    .map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: (match.metadata || {}) as ScoredChunkResult["metadata"],
    }));
}

/**
 * Deletes all vectors matching a specific source ID.
 *
 * @param sourceId - Source unique identifier.
 * @param namespace - Optional namespace.
 */
export async function deleteVectorsBySourceId(
  sourceId: string,
  namespace?: string,
) {
  if (!env.PINECONE_API_KEY) return;

  const index = getPineconeIndex();
  const targetIndex = namespace ? index.namespace(namespace) : index;

  await targetIndex.deleteMany({
    filter: {
      sourceId: { $eq: sourceId },
    },
  });
}

/**
 * Deletes all vectors matching an array of source IDs in a single bulk operation.
 *
 * @param sourceIds - Array of source unique identifiers.
 * @param namespace - Optional namespace.
 */
export async function deleteVectorsBySourceIds(
  sourceIds: string[],
  namespace?: string,
) {
  if (!env.PINECONE_API_KEY || sourceIds.length === 0) return;

  const index = getPineconeIndex();
  const targetIndex = namespace ? index.namespace(namespace) : index;

  await targetIndex.deleteMany({
    filter: {
      sourceId: { $in: sourceIds },
    },
  });
}

if (!env.PINECONE_API_KEY) {
  log.warn("PINECONE_API_KEY is not configured — vector search features will be disabled");
}
