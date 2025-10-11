/**
 * API route handlers for `/api/guardian/policies/[policy_id]/permissions/[permission_id]`.
 *
 * This module proxies requests to the guardian service for policy-permission association operations.
 *
 * ## Supported HTTP methods:
 * - **DELETE**: Remove a permission from a specific policy.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/policies/[policy_id]/permissions/[permission_id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";
import { cookies } from "next/headers";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles DELETE requests to `/api/guardian/policies/[policy_id]/permissions/[permission_id]`.
 *
 * Proxies the request to the guardian service to remove a permission from a policy.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing policy_id and permission_id.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string; permission_id: string }> }
) {
  const { policy_id, permission_id } = await params;
  logger.info(`DELETE request to /api/guardian/policies/${policy_id}/permissions/${permission_id}`);

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}/policies/${policy_id}/permissions/${permission_id}`);

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

  const res = await serverSessionFetch(`${GUARDIAN_SERVICE_URL}/policies/${policy_id}/permissions/${permission_id}`, {
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