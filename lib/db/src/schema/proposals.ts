import { createInsertSchema } from "drizzle-zod";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const proposalsTable = pgTable(
  "proposals",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    clientId: integer("client_id"),
    clientName: text("client_name").notNull(),
    title: text("title").notNull(),
    sourceText: text("source_text"),
    content: text("content").notNull(),
    amountCents: integer("amount_cents").notNull(),
    timeline: text("timeline").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("proposals_user_id_idx").on(table.userId)],
);

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
