import { eq, lt } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminContentResponse,
  GetPublicContentResponse,
  UpdateAdminContentBody,
  UpdateAdminContentResponse,
  type SiteContent,
} from "@workspace/api-zod";
import { db, siteContentTable, uploadedImagesTable } from "@workspace/db";
import { logger } from "../lib/logger.js";
import { requireAdmin } from "./auth.js";

const router: IRouter = Router();

const initialContent: SiteContent = {
  profile: {
    name: "Ashfa Aqeel",
    introduction: "",
    journey: [],
    interests: [],
    placesToFindMe: [],
  },
  appearance: {
    backgroundColor: "#f8f7f3",
    textColor: "#282a29",
    accentColor: "#557c9b",
    font: "mono",
    contentWidth: 620,
  },
  posts: [],
  caseStudies: [],
  books: [],
  bookCategories: ["Classics", "Economics", "Business", "Islam & History", "Other"],
};

const IMAGE_REFERENCE = /\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;
const ORPHAN_GRACE_MS = 60 * 60 * 1000;

/**
 * Removes uploaded images that no saved content refers to any more (replaced or
 * removed images). Images newer than an hour are kept so an upload that has not
 * been saved yet is never deleted. Failures never block saving content.
 */
async function removeOrphanedImages(document: unknown): Promise<void> {
  try {
    const referenced = new Set<string>();
    for (const match of JSON.stringify(document).matchAll(IMAGE_REFERENCE)) {
      if (match[1]) referenced.add(match[1]);
    }
    const candidates = await db
      .select({ id: uploadedImagesTable.id })
      .from(uploadedImagesTable)
      .where(lt(uploadedImagesTable.createdAt, new Date(Date.now() - ORPHAN_GRACE_MS)));
    for (const { id } of candidates) {
      if (!referenced.has(id)) {
        await db.delete(uploadedImagesTable).where(eq(uploadedImagesTable.id, id));
      }
    }
  } catch (error) {
    logger.warn({ err: error }, "Skipped orphaned image cleanup");
  }
}

async function loadOrCreateContent(): Promise<SiteContent> {
  const [existing] = await db
    .select()
    .from(siteContentTable)
    .where(eq(siteContentTable.id, 1))
    .limit(1);

  if (existing) {
    return GetAdminContentResponse.parse(existing.document) as SiteContent;
  }

  await db
    .insert(siteContentTable)
    .values({
      id: 1,
      document: initialContent as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: siteContentTable.id });

  const [created] = await db
    .select()
    .from(siteContentTable)
    .where(eq(siteContentTable.id, 1))
    .limit(1);

  if (!created) {
    throw new Error("Unable to initialize website content.");
  }

  return GetAdminContentResponse.parse(created.document) as SiteContent;
}

router.get("/content", async (_req, res): Promise<void> => {
  const content = await loadOrCreateContent();
  const publicContent: SiteContent = {
    ...content,
    posts: content.posts.filter((post) => post.published),
    caseStudies: content.caseStudies.filter((study) => study.published),
    books: content.books.filter((book) => book.published),
  };
  res.json(GetPublicContentResponse.parse(publicContent));
});

router.get("/admin/content", requireAdmin, async (_req, res): Promise<void> => {
  const content = await loadOrCreateContent();
  res.json(GetAdminContentResponse.parse(content));
});

router.put("/admin/content", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "The content could not be saved. Check the fields and try again.",
    });
    return;
  }

  await db
    .insert(siteContentTable)
    .values({
      id: 1,
      document: parsed.data as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: siteContentTable.id,
      set: { document: parsed.data, updatedAt: new Date() },
    });

  await removeOrphanedImages(parsed.data);
  res.json(UpdateAdminContentResponse.parse(parsed.data));
});

export default router;
