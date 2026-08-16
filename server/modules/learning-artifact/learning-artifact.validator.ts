import { z } from "zod";

export const createArtifactSchema = z.object({
  type: z.enum([
    "SUMMARY",
    "TAKEAWAYS",
    "FLASHCARDS",
    "QUIZ",
    "MINDMAP",
    "REPORT",
  ]),
  title: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
});

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;
