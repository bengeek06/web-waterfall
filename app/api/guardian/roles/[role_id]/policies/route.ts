/**
 * API route handlers for `/api/guardian/roles/[role_id]/policies
 *
 * This module proxies requests to the guardian service for policies on a specific role.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch policies by role ID.
 * - **POST**:    Add policies to a role by its ID.
 * - **DELETE**: Remove a policy from a role by its ID.
 *
 * ## Implementation details:
 * - The route expects a `role_id` parameter in the URL.
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/roles/[role_id]/policies/route
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
function getRoleIdFromParams(params: { role_id?: string }) {
  if (!params?.role_id) throw new Error("Missing role_id param");
  return params.role_id;
}

/**
 * Proxies a request to the guardian service for the specified role.
 *
 * This function handles GET, POST, and DELETE requests to the `/roles/[role_id]/policies` endpoint.
 * It forwards all headers except "host" and returns the response from the guardian service.
 *
 * @param req - The incoming Next.js request object.
 * @param method - The HTTP method of the request (GET, POST, DELETE).
 * @param role_id - The ID of the role to be accessed or modified.
 * @returns A `NextResponse` containing the proxied response from the guardian service.
 */
async function proxyRequest(
  req: NextRequest,
  method: string,
  role_id: string
) {
  logger.info(`${method} request to /api/guardian/roles/${role_id}/policies`);

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("Missing GUARDIAN_SERVICE_URL");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  const url = `${GUARDIAN_SERVICE_URL}/roles/${role_id}/policies`;
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Ajout duplex: "half" si body présent (Node.js fetch requirement)
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (req.body) {
    fetchOptions.body = req.body;
    // @ts-expect-error Node.js fetch requires duplex for streaming body
    fetchOptions.duplex = "half";
  }

  const response = await serverSessionFetch(url, fetchOptions);

  if (!response.ok) {
    logger.error(`Error ${method} /roles/${role_id}/policies: ${response.statusText}`);
    return NextResponse.json({ error: response.statusText }, { status: response.status });
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ message: "Success" });
}

function extractParams(params: { role_id?: string } | Promise<{ role_id?: string }>) {
  if (typeof (params as Promise<unknown>).then === "function") {
    // params is a Promise
    return params as Promise<{ role_id?: string }>;
  }
  // params is an object
  return Promise.resolve(params as { role_id?: string });
}

export async function GET(req: NextRequest, context: { params: { role_id?: string } } | { params: Promise<{ role_id?: string }> }) {
  const params = await extractParams(context.params);
  const role_id = getRoleIdFromParams(params);
  return proxyRequest(req, "GET", role_id);
}

export async function POST(req: NextRequest, context: { params: { role_id?: string } } | { params: Promise<{ role_id?: string }> }) {
  const params = await extractParams(context.params);
  const role_id = getRoleIdFromParams(params);
  return proxyRequest(req, "POST", role_id);
}

export async function DELETE(req: NextRequest, context: { params: { role_id?: string } } | { params: Promise<{ role_id?: string }> }) {
  const params = await extractParams(context.params);
  const role_id = getRoleIdFromParams(params);
  return proxyRequest(req, "DELETE", role_id);
}