/**
 * API route handlers for `/api/guardian/policies/[policy_id]/permissions`.
 *
 * This module proxies requests to the guardian service for operations on a specific policy.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch permissions by policy ID.
 * - **POST**:    Add permissions to a policy by its ID.
 * - **DELETE**: Remove a permission from a policy by its ID.
 *
 * ## Implementation details:
 * - The route expects a `policy_id` parameter in the URL.
 * - All requests are proxied to the backend guardian service, using the `GUARDIAN_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/policies/[policy_id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkSessionAndFetch } from "@/lib/sessionFetch";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Extracts the `policy_id` from the route parameters.
 *
 * @param params - The route parameters object.
 * @returns The `policy_id` string.
 * @throws {Error} If the `policy_id` parameter is missing.
 */
function getPolicyIdFromParams(params: { policy_id?: string }) {
  if (!params?.policy_id) throw new Error("Missing policy_id param");
  return params.policy_id;
}

/**
 * Proxies a request to the guardian service for the specified policy.
 *
 * This function handles GET, POST, and DELETE requests to the `/policies/[policy_id]/permissions` endpoint.
 * It forwards all headers except "host" and returns the response from the guardian service.
 *
 * @param req - The incoming Next.js request object.
 * @param method - The HTTP method of the request (GET, POST, DELETE).
 * @param policy_id - The ID of the policy to be accessed or modified.
 * @returns A `NextResponse` containing the proxied response from the guardian service.
 */
async function proxyRequest(
  req: NextRequest,
  method: string,
  policy_id: string
) {
  logger.info(`${method} request to /api/guardian/policies/${policy_id}/permissions`);
  
  if (process.env.MOCK_API === 'true') {
    logger.warn(`Running in development/test mode: returning mock response for ${method} on policy ID ${policy_id}`);
    if (method === "GET") {
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
        }
      ]);
    } else if (method === "POST") {
      return NextResponse.json({ message: `Mock: Permissions added to policy ${policy_id}` }, { status: 201 });
    } else if (method === "DELETE") {
      return NextResponse.json({ message: `Mock: Permission removed from policy ${policy_id}` }, { status: 200 });
    }
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("Missing GUARDIAN_SERVICE_URL");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  const url = `${GUARDIAN_SERVICE_URL}/policies/${policy_id}/permissions`;
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

  const response = await checkSessionAndFetch(url, fetchOptions);

  if (!response.ok) {
    logger.error(`Error ${method} /policies/${policy_id}/permissions: ${response.statusText}`);
    return NextResponse.json({ error: response.statusText }, { status: response.status });
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ message: "Success" });
}

function extractParams(params: { policy_id?: string } | Promise<{ policy_id?: string }>) {
  if (typeof (params as Promise<unknown>).then === "function") {
    // params is a Promise
    return params as Promise<{ policy_id?: string }>;
  }
  // params is an object
  return Promise.resolve(params as { policy_id?: string });
}

export async function GET(req: NextRequest, context: { params: { policy_id?: string } } | { params: Promise<{ policy_id?: string }> }) {
  const params = await extractParams(context.params);
  const policy_id = getPolicyIdFromParams(params);
  return proxyRequest(req, "GET", policy_id);
}

export async function POST(req: NextRequest, context: { params: { policy_id?: string } } | { params: Promise<{ policy_id?: string }> }) {
  const params = await extractParams(context.params);
  const policy_id = getPolicyIdFromParams(params);
  return proxyRequest(req, "POST", policy_id);
}

export async function DELETE(req: NextRequest, context: { params: { policy_id?: string } } | { params: Promise<{ policy_id?: string }> }) {
  const params = await extractParams(context.params);
  const policy_id = getPolicyIdFromParams(params);
  return proxyRequest(req, "DELETE", policy_id);
}