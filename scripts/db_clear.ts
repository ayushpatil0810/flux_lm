import pg from "pg";
import { Pinecone } from "@pinecone-database/pinecone";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "" });
const indexName = process.env.PINECONE_INDEX || "flux";

async function clearData() {
  console.log("[db:clear] 1. Truncating PostgreSQL workspace & application data...");
  await client.connect();

  await client.query('TRUNCATE TABLE "workspace" CASCADE');

  const tables = [
    "workspace",
    "source",
    "source_chunk",
    "conversation",
    "message",
    "learning_artifact",
  ];

  for (const t of tables) {
    const res = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`  - ${t}: ${res.rows[0].count} rows`);
  }
  await client.end();

  console.log(`\n[db:clear] 2. Wiping Pinecone index '${indexName}'...`);
  const index = pinecone.index(indexName);
  await index.deleteAll();

  // Short delay to let Pinecone propagate
  await new Promise((r) => setTimeout(r, 1500));
  const stats = await index.describeIndexStats();
  console.log(`  - Pinecone total vectors: ${stats.totalRecordCount}`);

  console.log("\n✓ Database and vector database successfully cleared!");
}

clearData().catch((err) => {
  console.error("[db:clear] Error clearing data:", err);
  process.exit(1);
});
