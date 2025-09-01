/**
 * Handles GET requests to verify authentication by proxying the request to the AUTH_SERVICE_URL.
 * 
 * - Forwards all request headers except "host".
 * - Includes credentials in the proxied request.
 * - Returns the response from the authentication service, preserving status and content.
 * - If the response contains a "set-cookie" header, it is set on the outgoing response.
 * - Supports both JSON and plain text responses based on the "content-type" header.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the authentication service.
 */
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to /api/auth/verify endpoint.
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the authentication service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/auth/verify");

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    logger.warn("Mocking authentication service response");
    const res = NextResponse.json({ user_id: "some-id", company_id: "another-id", email: "user@domain", valid: true });
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

  const res = await fetch(`${AUTH_SERVICE_URL}/verify`, {
    method: "GET",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
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