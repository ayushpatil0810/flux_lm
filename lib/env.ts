import { z } from "zod";

/**
 * Zod schema for validating and typing environment variables.
 */
const envSchema = z.object({
  // Core & Database
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication & Security (Better Auth & OAuth)
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),

  // External Integrations (Firecrawl)
  FIRECRAWL_API_KEY: z.string().optional(),

  // Cloudflare R2 Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // AI & RAG (OpenAI & Pinecone)
  OPENAI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),

  // Inngest Background Workflows
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      "❌ Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables configuration");
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
