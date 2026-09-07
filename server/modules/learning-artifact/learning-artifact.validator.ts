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

export const updateArtifactSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
});

export type UpdateArtifactInput = z.infer<typeof updateArtifactSchema>;

