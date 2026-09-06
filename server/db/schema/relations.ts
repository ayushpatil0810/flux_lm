import { relations } from "drizzle-orm";
import { user, session, account } from "./auth";
import { workspace } from "./workspace";
import { source, sourceChunk } from "./source";
import { conversation, message } from "./conversation";
import { learningArtifact } from "./learning-artifact";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  workspaces: many(workspace),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  user: one(user, {
    fields: [workspace.userId],
    references: [user.id],
  }),
  sources: many(source),
  conversations: many(conversation),
  artifacts: many(learningArtifact),
}));

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

export const learningArtifactRelations = relations(
  learningArtifact,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [learningArtifact.workspaceId],
      references: [workspace.id],
    }),
  }),
);
