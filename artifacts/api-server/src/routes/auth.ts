import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetAdminSessionResponse,
  LoginAdminBody,
  LoginAdminResponse,
  LogoutAdminResponse,
  type SessionStatus,
} from "@workspace/api-zod";

const router: IRouter = Router();
const COOKIE_NAME = "ashfa_admin_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

type AdminSession = {
  email: string;
  expiresAt: number;
};

type AuthConfig = {
  email: string;
  password: string;
  secret: string;
};

function getAuthConfig(): AuthConfig | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!email || !password || password.length < 12 || !secret) {
    return null;
  }

  return { email, password, secret };
}

function safeTextEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function makeToken(session: AdminSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(req: Request): AdminSession | null {
  const config = getAuthConfig();
  const token = req.cookies?.[COOKIE_NAME];
  if (!config || typeof token !== "string") return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = createHmac("sha256", config.secret)
    .update(payload)
    .digest();
  let receivedSignature: Buffer;
  try {
    receivedSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;
    if (
      session.email !== config.email ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return { email: session.email, expiresAt: session.expiresAt };
  } catch {
    return null;
  }
}

function sessionStatus(req: Request): SessionStatus {
  const session = readSession(req);
  return {
    authenticated: Boolean(session),
    email: session?.email ?? null,
  };
}

function setSessionCookie(
  req: Request,
  res: Response,
  session: AdminSession,
  secret: string,
): void {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0];
  const secure =
    process.env.NODE_ENV === "production" || forwardedProtocol === "https";
  res.cookie(COOKIE_NAME, makeToken(session, secret), {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS * 1000,
  });
}

function getRateLimitKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req: Request): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedAttempts.delete(key);
    return false;
  }
  return current.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(req: Request): void {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

router.get("/auth/session", (req, res): void => {
  res.json(GetAdminSessionResponse.parse(sessionStatus(req)));
});

router.post("/auth/login", (req, res): void => {
  const parsed = LoginAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email address and password." });
    return;
  }

  const config = getAuthConfig();
  if (!config) {
    res.status(503).json({
      error:
        "Admin sign-in is not configured. Add ADMIN_EMAIL and ADMIN_PASSWORD in project secrets.",
    });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({
      error: "Too many sign-in attempts. Try again in 15 minutes.",
    });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (
    !safeTextEqual(email, config.email) ||
    !safeTextEqual(parsed.data.password, config.password)
  ) {
    recordFailedAttempt(req);
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  failedAttempts.delete(getRateLimitKey(req));
  const session: AdminSession = {
    email: config.email,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  };
  setSessionCookie(req, res, session, config.secret);
  res.json(LoginAdminResponse.parse(sessionStatusWith(session.email)));
});

router.post("/auth/logout", (req, res): void => {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0];
  const secure =
    process.env.NODE_ENV === "production" || forwardedProtocol === "https";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
  });
  res.json(LogoutAdminResponse.parse({ authenticated: false, email: null }));
});

function sessionStatusWith(email: string): SessionStatus {
  return { authenticated: true, email };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
): void {
  if (!readSession(req)) {
    res.status(401).json({ error: "Admin session required." });
    return;
  }
  next();
}

export default router;
