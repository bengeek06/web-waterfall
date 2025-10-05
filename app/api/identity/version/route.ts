/**
 * Handles GET requests to the `/api/identity/version` endpoint.
 *
 * Proxies the request to the configured identity service's `/version` endpoint,
 * forwarding all headers except "host" and including credentials.
 *
 * Logs the request and the target identity service URL for debugging purposes.
 *
 * 
 * Responds with the proxied response, preserving the status code and content type.
 * If the response is JSON, it returns a JSON response; otherwise, it returns the raw text.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the authentication service.
 */
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkSessionAndFetch } from "@/lib/sessionFetch";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to /api/identity/version endpoint.
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the authentication service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/identity/version");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Mocking identity service response");
    const res = NextResponse.json({ version: "1.0.0" });
    return res;
  }

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }

  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}`);

  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );

  const res = await checkSessionAndFetch(`${IDENTITY_SERVICE_URL}/version`, {
    method: "GET",
    headers,
  });

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
  return nextRes;
}