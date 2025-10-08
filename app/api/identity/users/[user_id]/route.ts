/**
 * API route handlers for `/api/identity/users/[user_id]`.
 *
 * This module proxies requests to the identity service for operations on a specific user.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch a user by its ID.
 * - **PUT**:    Replace a user by its ID.
 * - **PATCH**:  Partially update a user by its ID.
 * - **DELETE**: Remove a user by its ID.
 *
 * ## Implementation details:
 * - The route expects a `user_id` parameter in the URL.
 * - All requests are proxied to the backend identity service, using the `IDENTITY_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/identity/users/[user_id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { serverSessionFetch } from "@/lib/sessionFetch.server";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Extracts the `user_id` from the route parameters.
 *
 * @param params - The route parameters object.
 * @returns The `user_id` string.
 * @throws {Error} If the `user_id` parameter is missing.
 */
function getUserIdFromParams(params: { user_id?: string }) {
  if (!params?.user_id) throw new Error("Missing user_id param");
  return params.user_id;
}

/**
 * Proxies a request to the identity service for the specified user.
 *
 * This function handles GET, PUT, PATCH, and DELETE requests to the `/users/[user_id]` endpoint.
 * It forwards all headers except "host" and returns the response from the identity service.
 *
 * @param req - The incoming Next.js request object.
 * @param method - The HTTP method of the request (GET, PUT, PATCH, DELETE).
 * @param user_id - The ID of the user to be accessed or modified.
 * @returns A `NextResponse` containing the proxied response from the identity service.
 */
async function proxyRequest(
  req: NextRequest,
  method: string,
  user_id: string
) {
  logger.info(`${method} request to /api/identity/users/${user_id}`);
  
  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock user");
    if (method === "GET" || method === "PUT" || method === "PATCH") {
      return NextResponse.json({
        id: user_id,
        company_id: "c1",
        email: "mockuser@example.com",
        first_name: "Mock",
        last_name: "User",
        phone_number: "+33123456789",
        avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
        is_active: true,
        is_verified: true,
        role_id: "admin",
        position_id: "ceo",
        last_login_at: "2024-06-01T10:00:00Z",
        created_at: "2024-01-01T09:00:00Z",
        updated_at: "2024-06-01T10:00:00Z"
      });
    } else if (method === "DELETE") {
      return NextResponse.json({ message: "User deleted successfully" });
    } else {
      return NextResponse.json({ success: true });
    }
  }

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/users/${user_id}`);

  let body: string | undefined = undefined;
  if (["PUT", "PATCH"].includes(method)) {
    body = await req.text();
  }

  // Correction : retire tous les content-type avant d'ajouter le bon
  const rawHeaders = Array.from(req.headers.entries()).filter(
    ([key]) =>
      key.toLowerCase() !== "host" &&
      key.toLowerCase() !== "content-length" &&
      key.toLowerCase() !== "content-type"
  );
  const headers: Record<string, string> = {
    ...Object.fromEntries(rawHeaders),
  };
  if (["PUT", "PATCH"].includes(method)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await serverSessionFetch(`${IDENTITY_SERVICE_URL}/users/${user_id}`, {
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
 * Handles GET requests to fetch a user by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `user_id`.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);
  return proxyRequest(req, "GET", user_id);
}

/**
 * Handles PUT requests to replace a user by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `user_id`.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);
  return proxyRequest(req, "PUT", user_id);
}

/**
 * Handles PATCH requests to partially update a user by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `user_id`.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);
  return proxyRequest(req, "PATCH", user_id);
}

/**
 * Handles DELETE requests to remove a user by ID.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing `user_id`.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);
  return proxyRequest(req, "DELETE", user_id);
}