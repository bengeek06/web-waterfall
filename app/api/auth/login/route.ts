/**
 * Handles POST requests to the login API route.
 *
 * This function acts as a proxy to the authentication service's `/login` endpoint.
 * It forwards the incoming request body and headers (excluding the "host" header)
 * to the authentication service, and relays the response back to the client.
 *
 * - If the response is JSON, it returns a JSON response.
 * - Otherwise, it returns the response as plain text.
 * - If a `set-cookie` header is present in the response, it is included in the outgoing response.
 *
 * @param req - The incoming Next.js request object.
 * @returns A `NextResponse` object containing the proxied response from the authentication service.
 */
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to the login API route.
 *
 * @param req - The incoming Next.js request object.
 * @returns A `NextResponse` object containing the proxied response from the authentication service.
 */
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/auth/login");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Mocking authentication service response");
    const res = NextResponse.json({ success: true, user_id: "mock-user-id", message: "Login successful" });
    res.headers.set(
      "set-cookie",
      "auth_token=mocktoken; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600"
    );
    return res;
  }

  if (!AUTH_SERVICE_URL) {
    logger.error("AUTH_SERVICE_URL is not defined");
    return NextResponse.json({ error: "AUTH_SERVICE_URL is not defined" }, { status: 500 });
  }

  logger.debug(`Environment AUTH_SERVICE_URL: ${AUTH_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${AUTH_SERVICE_URL}`);

  const body = await req.text();
  const res = await fetch(`${AUTH_SERVICE_URL}/login`, {
    method: "POST",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    body,
    credentials: "include",
  });

  const setCookie = res.headers.get("set-cookie");
  const contentType = res.headers.get("content-type");
  let nextRes;
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    logger.debug(`Response data: ${JSON.stringify(data)}`);
    nextRes = NextResponse.json(data, { status: res.status });
  } else {
    const text = await res.text();
    logger.debug(`Response text: ${text}`);
    nextRes = new NextResponse(text, { status: res.status });
  }
  if (setCookie) nextRes.headers.set("set-cookie", setCookie);
  return nextRes;
}