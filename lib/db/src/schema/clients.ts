import { createInsertSchema } from "drizzle-zod";
import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const clientsTable = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    company: text("company"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("clients_user_id_idx").on(table.userId)],
);

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
