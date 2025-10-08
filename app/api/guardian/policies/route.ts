/**
 * API route handlers for `/api/guardian/policies`.
 *
 * This module proxies requests to the guardian service for policy-related operations.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch all policies.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/policies/route
 */
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";
import { cookies } from "next/headers";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to `/api/guardian/policies`.
 *
 * Proxies the request to the guardian service, forwarding all headers except "host".
 * Returns the response from the guardian service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/guardian/policies");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock policies");
    return NextResponse.json([
      {
        id: "1",
        name: "Admin",
        description: "Administrator with full access",
        permissions: [],
      },
      {
        id: "2",
        name: "User",
        description: "Regular user with limited access",
        permissions: [],
      }
    ]);
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}`);

  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  logger.debug(`Forwarded cookie header: ${headers.Cookie}`);

  const res = await serverSessionFetch(`${GUARDIAN_SERVICE_URL}/policies`, {
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

/**
 * Handles POST requests to `/api/guardian/policies`.
 *
 * Proxies the request to the guardian service, forwarding all headers except "host".
 * Returns the response from the guardian service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/guardian/policies");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock policy creation response");
    return NextResponse.json(
      {
        id: "1",
        name: "Admin",
        description: "Administrator with full access",
      }
    );
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}/policies`);

  let body;
  try {
    body = await req.json();
    logger.debug(`POST body: ${JSON.stringify(body)}`);
  } catch (err) {
    logger.error(`Erreur lors du parsing du body JSON: ${err}`);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Correction : retire tous les content-type avant d'ajouter le bon
  const rawHeaders = Array.from(req.headers.entries()).filter(
    ([key]) => key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length" && key.toLowerCase() !== "content-type"
  );
  const headers = {
    ...Object.fromEntries(rawHeaders),
    "Content-Type": "application/json"
  };

  const res = await serverSessionFetch(`${GUARDIAN_SERVICE_URL}/policies`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
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
