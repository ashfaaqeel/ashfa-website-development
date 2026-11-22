import { randomUUID } from "node:crypto";
import express, { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, uploadedImagesTable } from "@workspace/db";
import { requireAdmin } from "./auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/** Vercel functions reject request bodies over ~4.5 MB, so stay below that. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Confirms the bytes really are the image type that was declared. */
function matchesSignature(type: string, b: Buffer): boolean {
  switch (type) {
    case "image/png":
      return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/gif":
      return b.length > 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("ascii"));
    case "image/webp":
      return b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

router.post(
  "/admin/images",
  requireAdmin,
  express.raw({ type: ALLOWED_TYPES, limit: MAX_IMAGE_BYTES }),
  async (req, res): Promise<void> => {
    const type = req.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!ALLOWED_TYPES.includes(type)) {
      res.status(415).json({ error: "Upload a PNG, JPEG, WebP or GIF image." });
      return;
    }
    const body: unknown = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "No image data was received." });
      return;
    }
    if (!matchesSignature(type, body)) {
      res.status(400).json({ error: "That file does not look like a valid image." });
      return;
    }

    const id = randomUUID();
    try {
      await db.insert(uploadedImagesTable).values({
        id,
        contentType: type,
        data: body,
        size: body.length,
      });
    } catch (error) {
      logger.error({ err: error }, "Image upload failed");
      if (isMissingTable(error)) {
        res.status(503).json({
          error: "Image storage is not set up yet. Run the database push/migration, then try again.",
        });
        return;
      }
      res.status(500).json({ error: "The image could not be stored. Please try again." });
      return;
    }
    res.status(201).json({ id, url: `/api/images/${id}`, contentType: type, size: body.length });
  },
);

router.get("/images/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!ID_PATTERN.test(id)) {
    res.status(404).end();
    return;
  }
  try {
    const [image] = await db
      .select()
      .from(uploadedImagesTable)
      .where(eq(uploadedImagesTable.id, id))
      .limit(1);
    if (!image) {
      res.status(404).end();
      return;
    }
    res.set({
      "Content-Type": image.contentType,
      "Content-Length": String(image.size),
      // Ids are random and never reused, so the bytes behind one never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    });
    res.end(image.data);
  } catch (error) {
    logger.error({ err: error }, "Image read failed");
    res.status(500).end();
  }
});

export default router;
