/**
 * Handles GET requests to the `/api/guardian/health` endpoint.
 *
 * Proxies the request to the configured guardian service's `/health` endpoint,
 * forwarding all headers except "host" and including credentials.
 * 
 * Logs the request and the target guardian service URL for debugging purposes.
 * 
 * Responds with the proxied response, preserving the status code and content type.
 * If the response is JSON, it returns a JSON response; otherwise, it returns the raw text.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the guardian service.
 */
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to /api/guardian/health endpoint.
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the guardian service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/guardian/health");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Mocking guardian service response");
    const res = NextResponse.json({ status: "healthy", service: "guardian_service", message: "Service is running" });
    return res;
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "GUARDIAN_SERVICE_URL is not defined" }, { status: 500 });
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}`);

  const res = await fetch(`${GUARDIAN_SERVICE_URL}/health`, {
    method: "GET",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    credentials: "include",
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
