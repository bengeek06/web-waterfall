/**
 * API route handlers for `/api/guardian/roles/[role_id]`.
 *
 * This module proxies requests to the guardian service for operations on a specific role.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch a role by its ID.
 * - **PUT**:    Replace a role by its ID.
 * - **PATCH**:  Partially update a role by its ID.
 * - **DELETE**: Remove a role by its ID.
 *
 * ## Implementation details:
 * - The route expects a `role_id` parameter in the URL.
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/roles/[role_id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Extracts the `role_id` from the route parameters.
 *
 * @param params - The route parameters object.
 * @returns The `role_id` string.
 * @throws {Error} If the `role_id` parameter is missing.
 */
function getroleIdFromParams(params: { role_id?: string }) {
  if (!params?.role_id) throw new Error("Missing role_id param");
  return params.role_id;
}

/**
 * Proxies a request to the guardian service for the specified role.
 *
 * This function handles GET, PUT, PATCH, and DELETE requests to the `/roles/[role_id]` endpoint.
 * It forwards all headers except "host" and returns the response from the guardian service.
 *
 * @param req - The incoming Next.js request object.
 * @param method - The HTTP method of the request (GET, PUT, PATCH, DELETE).
 * @param role_id - The ID of the role to be accessed or modified.
 * @returns A `NextResponse` containing the proxied response from the guardian service.
 */
async function proxyRequest(
  req: NextRequest,
  method: string,
  role_id: string
) {
  logger.info(`${method} request to /api/guardian/roles/${role_id}`);
  
  if (process.env.MOCK_API === 'true') {
    logger.warn(`Running in development/test mode: returning mock role for ID ${role_id}`);
    return NextResponse.json({
      id: role_id,
      name: "Admin",
      description: "Administrator with full access",
    });
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}/roles/${role_id}`);

  let body: string | undefined = undefined;
  let headers: Record<string, string> = {};
  if (["PUT", "PATCH"].includes(method)) {
    body = await req.text();

    // Correction : retire tous les content-type avant d'ajouter le bon
    const rawHeaders = Array.from(req.headers.entries()).filter(
      ([key]) =>
        key.toLowerCase() !== "host" &&
        key.toLowerCase() !== "content-length" &&
        key.toLowerCase() !== "content-type"
    );
    headers = {
      ...Object.fromEntries(rawHeaders),
      "Content-Type": "application/json"
    };
  } else {
    headers = Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    );
  }

  const res = await serverSessionFetch(`${GUARDIAN_SERVICE_URL}/roles/${role_id}`, {
    method,
    headers,
    ...(body ? { body } : {}),
  });

  const setCookie = res.headers.get("set-cookie");
  const contentType = res.headers.get("content-type");
  let nextRes;
  if (res.status === 204) {
      nextRes = new NextResponse(null, { status: 204 });
  } else if (contentType && contentType.includes("application/json")) {
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

/**
 * Handles GET requests to fetch a role by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `role_id`.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ role_id: string }> }) {
  const resolvedParams = await params;
  const role_id = getroleIdFromParams(resolvedParams);
  return proxyRequest(req, "GET", role_id);
}

/**
 * Handles PUT requests to replace a role by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `role_id`.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ role_id: string }> }) {
  const resolvedParams = await params;
  const role_id = getroleIdFromParams(resolvedParams);
  return proxyRequest(req, "PUT", role_id);
}

/**
 * Handles PATCH requests to partially update a role by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `role_id`.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ role_id: string }> }) {
  const resolvedParams = await params;
  const role_id = getroleIdFromParams(resolvedParams);
  return proxyRequest(req, "PATCH", role_id);
}

/**
 * Handles DELETE requests to remove a role by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `role_id`.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ role_id: string }> }) {
  const resolvedParams = await params;
  const role_id = getroleIdFromParams(resolvedParams);
  return proxyRequest(req, "DELETE", role_id);
}