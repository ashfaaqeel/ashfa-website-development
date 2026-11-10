import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminContentResponse,
  GetPublicContentResponse,
  UpdateAdminContentBody,
  UpdateAdminContentResponse,
  type SiteContent,
} from "@workspace/api-zod";
import { db, siteContentTable } from "@workspace/db";
import { requireAdmin } from "./auth";

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
};

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

  res.json(UpdateAdminContentResponse.parse(parsed.data));
});

export default router;
