import { createId } from "@paralleldrive/cuid2";
import { index, jsonb, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { getWorkspaceEntityBase } from "./workspace";
import { timestamps } from "./utils";
import { LearningArtifactContent, LearningArtifactMetadata } from "./types";

export const artifactTypeEnum = pgEnum("artifact_type", [
  "SUMMARY",
  "TAKEAWAYS",
  "FLASHCARDS",
  "QUIZ",
  "MINDMAP",
  "REPORT",
]);

export const artifactStatusEnum = pgEnum("artifact_status", [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
]);

export const learningArtifact = pgTable(
  "learning_artifact",
  {
    ...getWorkspaceEntityBase(),
    type: artifactTypeEnum("type").notNull(),
    title: text("title").notNull(),
    content: jsonb("content").$type<LearningArtifactContent>(),
    sourceIds: text("source_ids").array(),
    status: artifactStatusEnum("status").default("PENDING").notNull(),
    metadata: jsonb("metadata").$type<LearningArtifactMetadata>(),
  },
  (table) => [
    index("learning_artifact_workspaceId_idx").on(table.workspaceId),
    index("learning_artifact_workspaceId_type_idx").on(
      table.workspaceId,
      table.type,
    ),
    index("learning_artifact_workspaceId_status_idx").on(
      table.workspaceId,
      table.status,
    ),
  ],
);
