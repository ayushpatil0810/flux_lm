import pg from "pg";
import { Pinecone, type RecordMetadata } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const indexName = process.env.PINECONE_INDEX || "flux";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 512;
const MAX_EMBEDDING_CHARS = 24000;

async function reindex() {
  console.log(`[Reindex] Connecting to database and Pinecone index '${indexName}'...`);
  await client.connect();
  const index = pinecone.index(indexName);

  const sourcesRes = await client.query(
    'SELECT id, "workspace_id", title, type, status, metadata FROM source'
  );
  console.log(`[Reindex] Found ${sourcesRes.rows.length} sources in database.`);

  let totalUpserted = 0;

  for (const src of sourcesRes.rows) {
    console.log(`\n[Reindex] Processing source: "${src.title}" (${src.id})`);

    const chunksRes = await client.query(
      'SELECT id, "index", content, metadata FROM source_chunk WHERE source_id = $1 ORDER BY "index" ASC',
      [src.id]
    );

    const chunks = chunksRes.rows;
    console.log(`  - Found ${chunks.length} chunks in database.`);
    if (chunks.length === 0) continue;

    const batchSize = 50;
    const pineconeItems = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const sanitized = batch.map((c) =>
        c.content.replace(/\n/g, " ").slice(0, MAX_EMBEDDING_CHARS)
      );

      const embRes = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        input: sanitized,
      });

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embRes.data[j].embedding;
        const chunkMetadata = chunk.metadata || {};

        pineconeItems.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            workspaceId: src.workspace_id,
            sourceId: src.id,
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            sourceTitle: src.title,
            sourceType: src.type,
            text: chunk.content.slice(0, 35000),
            ...(typeof chunkMetadata.page === "number" ? { page: chunkMetadata.page } : {}),
          },
        });
      }
    }

    const UPSERT_BATCH = 100;
    for (let i = 0; i < pineconeItems.length; i += UPSERT_BATCH) {
      const b = pineconeItems.slice(i, i + UPSERT_BATCH);
      await index.upsert({
        records: b.map((v) => ({
          id: v.id,
          values: v.values,
          metadata: v.metadata as RecordMetadata,
        })),
      });
    }

    totalUpserted += pineconeItems.length;
    console.log(`  ✓ Upserted ${pineconeItems.length} vectors to Pinecone.`);
  }

  const stats = await index.describeIndexStats();
  console.log(`\n[Reindex] Completed successfully! Total vectors in index: ${stats.totalRecordCount}`);

  await client.end();
}

reindex().catch((err) => {
  console.error("[Reindex] Error during reindexing:", err);
  process.exit(1);
});
