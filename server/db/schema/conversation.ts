import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
import { text, timestamp } from "drizzle-orm/pg-core";
import { workspace, workspaceEntityBase } from "./workspace";
import { timestamps } from "./utils";

export const messageRoleEnum = pgEnum("message_role", [
  "USER",
  "ASSISTANT",
]);

export const conversation = pgTable(
  "conversation",
  {
    ...workspaceEntityBase,
    title: text("title"),
    summary: text("summary"),
    summaryMessageCount: integer("summary_message_count").default(0).notNull(),
    summarizedAt: timestamp("summarized_at"),
  },
  (table) => [
    index("conversation_workspaceId_idx").on(table.workspaceId),
    index("conversation_workspaceId_updatedAt_idx").on(
      table.workspaceId,
      table.updatedAt,
    ),
  ],
);

export const message = pgTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_conversationId_idx").on(table.conversationId),
    index("message_conversationId_createdAt_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [conversation.workspaceId],
    references: [workspace.id],
  }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}));
