/**
 * API route handlers for `/api/guardian/permissions`.
 *
 * This module proxies requests to the guardian service for permission-related operations.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch all permissions.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/permissions/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";
import { cookies } from "next/headers";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to `/api/guardian/permissions`.
 *
 * Proxies the request to the guardian service, forwarding all headers except "host".
 * Returns the response from the guardian service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/guardian/permissions");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock permissions");
    return NextResponse.json([
      {
        id: "1",
        service: "identity",
        resource: "user",
        description: "Manage users",
        operations: ["create", "read", "update", "delete"]
      },
      {
        id: "2",
        service: "identity",
        resource: "role",
        description: "Manage roles",
        operations: ["create", "read", "update", "delete"]
      },
      {
        id: "3",
        service: "guardian",
        resource: "permission",
        description: "Manage permissions",
        operations: ["create", "read", "update", "delete"]
      }
    ]);
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}`);

  // Forward all headers except "host"
  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(
      ([key]) => key.toLowerCase() !== "host"
    )
  );

  // Ajoute le cookie du client
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  logger.debug(`Forwarded cookie header: ${headers.Cookie}`);

  const res = await serverSessionFetch(`${GUARDIAN_SERVICE_URL}/permissions`, {
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