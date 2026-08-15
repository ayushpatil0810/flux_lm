import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { workspace } from "./workspace";
import { timestamps } from "./utils";

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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    type: artifactTypeEnum("type").notNull(),
    title: text("title").notNull(),
    content: jsonb("content"),
    sourceIds: text("source_ids").array(),
    status: artifactStatusEnum("status").default("PENDING").notNull(),
    metadata: jsonb("metadata"),
    ...timestamps,
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

export const learningArtifactRelations = relations(
  learningArtifact,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [learningArtifact.workspaceId],
      references: [workspace.id],
    }),
  }),
);
