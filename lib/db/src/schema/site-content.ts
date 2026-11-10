import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const siteContentTable = pgTable("site_content", {
  id: integer("id").primaryKey().default(1),
  document: jsonb("document")
    .notNull()
    .$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteContentRecord = typeof siteContentTable.$inferSelect;
