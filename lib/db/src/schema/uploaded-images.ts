import { customType, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Uploaded images are stored in PostgreSQL so they persist across refreshes,
 * restarts and redeployments on any host (Replit, Vercel, ...) without needing
 * a separate object-storage account.
 */
export const uploadedImagesTable = pgTable("uploaded_images", {
  id: text("id").primaryKey(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UploadedImageRecord = typeof uploadedImagesTable.$inferSelect;
