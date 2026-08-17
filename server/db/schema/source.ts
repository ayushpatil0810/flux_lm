import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { getWorkspaceEntityBase, workspace } from "./workspace";
import { timestamps } from "./utils";
import { SourceChunkMetadata, SourceMetadata } from "./types";

export const sourceTypeEnum = pgEnum("source_type", [
  "PDF",
  "WEBSITE",
  "YOUTUBE",
  "TEXT",
  "MARKDOWN",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
]);

export const source = pgTable(
  "source",
  {
    ...getWorkspaceEntityBase(),
    ...timestamps,
    type: sourceTypeEnum("type").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    url: text("url"),
    status: sourceStatusEnum("status").default("PENDING").notNull(),
    metadata: jsonb("metadata").$type<SourceMetadata>(),
  },
  (table) => [
    index("source_workspaceId_idx").on(table.workspaceId),
    index("source_workspaceId_type_idx").on(table.workspaceId, table.type),
    index("source_workspaceId_status_idx").on(table.workspaceId, table.status),
  ],
);

export const sourceChunk = pgTable(
  "source_chunk",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    sourceId: text("source_id")
      .notNull()
      .references(() => source.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    metadata: jsonb("metadata").$type<SourceChunkMetadata>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("source_chunk_sourceId_index_unique").on(table.sourceId, table.index),
    index("source_chunk_sourceId_idx").on(table.sourceId),
  ],
);

export const sourceRelations = relations(source, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [source.workspaceId],
    references: [workspace.id],
  }),
  chunks: many(sourceChunk),
}));

export const sourceChunkRelations = relations(sourceChunk, ({ one }) => ({
  source: one(source, {
    fields: [sourceChunk.sourceId],
    references: [source.id],
  }),
}));
