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

export const remindersTable = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    invoiceId: integer("invoice_id").notNull(),
    timing: text("timing").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reminders_user_id_idx").on(table.userId)],
);

export const insertReminderSchema = createInsertSchema(remindersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;
