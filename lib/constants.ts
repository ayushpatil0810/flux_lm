/** Default chat model when the client or workspace does not specify one. */
export const CHAT_MODEL = "gpt-5.4-mini";

/** Allowed chat models exposed to the client and workspace settings. */
export const CHAT_MODELS = ["gpt-5.4-mini", "gpt-5.4-nano"] as const;

/** OpenAI embedding model used for RAG vector indexing and query embedding. */
export const EMBEDDING_MODEL = "text-embedding-3-small";

/** Vector dimension count — must match Pinecone index configuration. */
export const EMBEDDING_DIMENSIONS = 512;

/** Target max characters per text chunk during source processing. */
export const CHUNK_SIZE = 1000;

/** Character overlap between consecutive chunks at split boundaries. */
export const CHUNK_OVERLAP = 100;

/** Number of Pinecone chunks to retrieve per chat query (baseline / per sub-search in advanced pipeline). */
export const RAG_TOP_K = 6;

/**
 * Minimum cosine similarity score for a retrieved chunk to be included in context.
 * Set to 0.20 for `text-embedding-3-small` (512 dimensions), where broad/thematic queries
 * (e.g. "main insights", "summarize") naturally score between 0.22–0.32.
 */
export const RAG_MIN_SCORE = 0.2;

/** Candidates fetched per sub-search in the advanced RAG pipeline (query + HyDE vectors). */
export const RAG_CANDIDATE_FETCH_K = 12;

/** Final chunks surfaced to the LLM after RRF fusion and deduplication. */
export const RAG_FINAL_TOP_K = 8;

/** Fast chat model used for query enhancement and HyDE passage generation. */
export const RAG_HYDE_MODEL = "gpt-5.4-mini";

/** Enqueue a conversation summary job every N persisted messages. */
export const CONVERSATION_SUMMARY_INTERVAL = 8;

/** Max recent UI messages sent to the model when a rolling summary exists. */
export const RECENT_MESSAGE_WINDOW = 12;
