import { z } from "zod";

export const createMemorySchema = z.object({
  text: z.string().min(1, "Memory text cannot be empty").max(1000, "Memory text is too long"),
});

export const updateMemorySchema = z.object({
  text: z.string().min(1, "Memory text cannot be empty").max(1000, "Memory text is too long"),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
