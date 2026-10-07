import { createInsertSchema } from "drizzle-zod";
import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const invoicesTable = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    clientId: integer("client_id"),
    proposalId: integer("proposal_id"),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email"),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("unpaid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("invoices_user_id_idx").on(table.userId)],
);

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
