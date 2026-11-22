import { logger } from "./logger";

export type EmailResult = { sent: boolean; error: string | null };

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * Delivers a contact-form message to the site owner through the Resend HTTP API.
 * Needs RESEND_API_KEY and CONTACT_TO_EMAIL. Without them nothing is sent, and the
 * message is still kept in the database and shown in the private editor.
 */
export async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  if (!apiKey || !to) {
    return { sent: false, error: "Email delivery is not configured (RESEND_API_KEY / CONTACT_TO_EMAIL)." };
  }
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || "Website contact <onboarding@resend.dev>";
  const safeName = input.name.replace(/[\r\n]+/g, " ").trim();

  try {
    const response = await fetch(process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: input.email,
        subject: `New message from ${safeName}`.slice(0, 150),
        text: `From: ${safeName} <${input.email}>\n\n${input.message}`,
        html: `<p><strong>${escapeHtml(safeName)}</strong> &lt;${escapeHtml(input.email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      logger.error({ status: response.status }, "Contact email provider rejected the request");
      return { sent: false, error: `Email provider error ${response.status}: ${detail}` };
    }
    return { sent: true, error: null };
  } catch (error) {
    logger.error({ err: error }, "Contact email request failed");
    return { sent: false, error: error instanceof Error ? error.message : "Email request failed." };
  }
}
