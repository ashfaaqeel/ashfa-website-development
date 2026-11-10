import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

type VercelRequest = IncomingMessage & {
  url?: string;
};

type ExpressListener = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;

const expressListener = app as unknown as ExpressListener;

export default function handler(
  request: VercelRequest,
  response: ServerResponse,
): void {
  const rewrittenUrl = new URL(
    request.url ?? "/",
    "http://vercel-function.local",
  );
  const route = rewrittenUrl.searchParams.get("__route");

  if (route !== null) {
    rewrittenUrl.searchParams.delete("__route");
    const suffix = rewrittenUrl.searchParams.toString();
    request.url = `/api${route.startsWith("/") ? route : `/${route}`}${
      suffix ? `?${suffix}` : ""
    }`;
  } else if (!rewrittenUrl.pathname.startsWith("/api/")) {
    request.url = `/api${rewrittenUrl.pathname}${rewrittenUrl.search}`;
  }

  expressListener(request, response);
}
