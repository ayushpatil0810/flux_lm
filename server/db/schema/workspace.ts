import { createId } from "@paralleldrive/cuid2";
import { index, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./utils";
import { user } from "./auth";
import { CHAT_MODEL } from "@/lib/constants";

export function getWorkspaceEntityBase() {
  return {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    ...timestamps,
  };
}

export const workspace = pgTable(
  "workspace",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    icon: text("icon"),
    defaultModel: text("default_model").default(CHAT_MODEL).notNull(),
    ...timestamps,
  },
  (table) => [index("workspace_userId_idx").on(table.userId)],
);
