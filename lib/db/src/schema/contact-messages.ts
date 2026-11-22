import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const contactMessagesTable = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    /** SHA-256 of the sender IP + secret, used only for rate limiting. */
    ipHash: text("ip_hash").notNull().default(""),
    emailed: boolean("emailed").notNull().default(false),
    emailError: text("email_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contact_messages_ip_created_idx").on(table.ipHash, table.createdAt)],
);

export type ContactMessageRecord = typeof contactMessagesTable.$inferSelect;
