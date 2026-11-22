import { createHash } from "node:crypto";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ListContactMessagesResponse,
  SendContactMessageBody,
  SendContactMessageResponse,
  DeleteContactMessageResponse,
} from "@workspace/api-zod";
import { contactMessagesTable, db } from "@workspace/db";
import { requireAdmin } from "./auth";
import { sendContactEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_SENDER = 5;
const MAX_TOTAL = 100;

function senderHash(ip: string): string {
  return createHash("sha256")
    .update(`${ip}|${process.env.SESSION_SECRET ?? "contact"}`)
    .digest("hex");
}

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter your name, a valid email and a message of at least 10 characters." });
    return;
  }
  const { email, message, website } = parsed.data;
  const name = parsed.data.name.replace(/\s+/g, " ").trim();

  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (website && website.trim() !== "") {
    res.json(SendContactMessageResponse.parse({ ok: true }));
    return;
  }

  const ipHash = senderHash(req.ip || req.socket.remoteAddress || "unknown");
  const since = new Date(Date.now() - WINDOW_MS);

  try {
    const [sender] = await db
      .select({ value: count() })
      .from(contactMessagesTable)
      .where(and(eq(contactMessagesTable.ipHash, ipHash), gte(contactMessagesTable.createdAt, since)));
    const [total] = await db
      .select({ value: count() })
      .from(contactMessagesTable)
      .where(gte(contactMessagesTable.createdAt, since));
    if ((sender?.value ?? 0) >= MAX_PER_SENDER || (total?.value ?? 0) >= MAX_TOTAL) {
      res.status(429).json({ error: "Too many messages just now. Please try again later." });
      return;
    }

    const [saved] = await db
      .insert(contactMessagesTable)
      .values({ name, email: email.trim(), message: message.trim(), ipHash })
      .returning({ id: contactMessagesTable.id });

    const result = await sendContactEmail({ name, email: email.trim(), message: message.trim() });
    if (saved) {
      await db
        .update(contactMessagesTable)
        .set({ emailed: result.sent, emailError: result.error })
        .where(eq(contactMessagesTable.id, saved.id));
    }
    res.json(SendContactMessageResponse.parse({ ok: true }));
  } catch (error) {
    logger.error({ err: error }, "Contact message failed");
    res.status(500).json({ error: "Your message could not be sent. Please try again in a moment." });
  }
});

router.get("/admin/messages", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(contactMessagesTable)
    .orderBy(desc(contactMessagesTable.createdAt))
    .limit(200);
  res.json(
    ListContactMessagesResponse.parse(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        message: row.message,
        createdAt: row.createdAt.toISOString(),
        emailed: row.emailed,
        emailError: row.emailError,
      })),
    ),
  );
});

router.delete("/admin/messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid message id." });
    return;
  }
  await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, id));
  res.json(DeleteContactMessageResponse.parse({ ok: true }));
});

export default router;
