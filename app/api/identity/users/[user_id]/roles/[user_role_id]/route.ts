/**
 * API route handlers for `/api/identity/users/[user_id]/roles/[user_role_id]`.
 *
 * This module proxies requests to the identity service for user role association operations.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch a specific role for a user.
 * - **DELETE**: Remove a role from a user.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend identity service, using the `IDENTITY_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/identity/users/[user_id]/roles/[user_role_id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Extracts parameters from the route.
 *
 * @param params - The route parameters object.
 * @returns The extracted parameters.
 * @throws {Error} If required parameters are missing.
 */
function getParamsFromRoute(params: { user_id?: string; user_role_id?: string }) {
  if (!params?.user_id) throw new Error("Missing user_id param");
  if (!params?.user_role_id) throw new Error("Missing user_role_id param");
  return { user_id: params.user_id, user_role_id: params.user_role_id };
}

/**
 * Handles GET requests to `/api/identity/users/[user_id]/roles/[user_role_id]`.
 *
 * Proxies the request to the identity service, forwarding all headers except "host".
 * Returns the response from the identity service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing user_id and user_role_id.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ user_id: string; user_role_id: string }> }) {
  logger.info("GET request to /api/identity/users/[user_id]/roles/[user_role_id]");

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }

  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);

  const resolvedParams = await params;
  const { user_id, user_role_id } = getParamsFromRoute(resolvedParams);

  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/users/${user_id}/roles/${user_role_id}`);

  // Forward all headers except "host"
  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );

  const res = await serverSessionFetch(`${IDENTITY_SERVICE_URL}/users/${user_id}/roles/${user_role_id}`, {
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
 * Handles DELETE requests to `/api/identity/users/[user_id]/roles/[user_role_id]`.
 *
 * Proxies the request to the identity service to remove a role from a user.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing user_id and user_role_id.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ user_id: string; user_role_id: string }> }) {
  logger.info("DELETE request to /api/identity/users/[user_id]/roles/[user_role_id]");

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }

  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);

  const resolvedParams = await params;
  const { user_id, user_role_id } = getParamsFromRoute(resolvedParams);

  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/users/${user_id}/roles/${user_role_id}`);

  // Forward all headers except "host"
  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );

  const res = await serverSessionFetch(`${IDENTITY_SERVICE_URL}/users/${user_id}/roles/${user_role_id}`, {
    method: "DELETE",
    headers,
  });

  logger.debug(`Response status: ${res.status}`);
  
  // Pour DELETE, souvent pas de body (204 No Content)
  if (res.status === 204) {
    logger.debug("204 No Content response, returning empty response");
    return new NextResponse(null, { status: 204 });
  }

  const contentType = res.headers.get("content-type");
  let nextRes;
  if (contentType && contentType.includes("application/json")) {
    try {
      const data = await res.json();
      logger.debug(`Response data: ${JSON.stringify(data)}`);
      nextRes = NextResponse.json(data, { status: res.status });
    } catch (e) {
      logger.warn(`Failed to parse JSON response: ${e}`);
      nextRes = new NextResponse(null, { status: res.status });
    }
  } else {
    try {
      const text = await res.text();
      logger.debug(`Response text: ${text}`);
      nextRes = new NextResponse(text, { status: res.status });
    } catch (e) {
      logger.warn(`Failed to read text response: ${e}`);
      nextRes = new NextResponse(null, { status: res.status });
    }
  }
  return nextRes;
}