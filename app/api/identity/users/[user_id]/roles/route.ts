/**
 * API route handlers for `/api/identity/users/[user_id]/roles`.
 *
 * This module proxies requests to the identity service for user-related operations.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch all roles for a user.
 * - **POST**:   Create a new role for a user.
 * - **DELETE**: Remove a role from a user.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend identity service, using the `IDENTITY_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/identity/users/[user_id]/roles/route
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
 * Handles GET requests to `/api/identity/users/[user_id]/roles`.
 *
 * Proxies the request to the identity service, forwarding all headers except "host".
 * Returns the response from the identity service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  logger.info("GET request to /api/identity/users/[user_id]/roles");

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

  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);

  const res = await serverSessionFetch(`${IDENTITY_SERVICE_URL}/users/${user_id}/roles`, {
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
 * Handles POST requests to `/api/identity/users/[user_id]/roles`.
 *
 * Proxies the request body and headers to the identity service and returns the response.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ user_id: string }> }) {
  logger.info("POST request to /api/identity/users/[user_id]/roles");

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}`);

  // Parse le body JSON
  let body;
  try {
    body = await req.json();
    logger.debug(`POST body: ${JSON.stringify(body)}`);
  } catch (err) {
    logger.error(`Erreur lors du parsing du body JSON: ${err}`);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Construit les headers de manière propre
  const forwardedHeaders = new Headers();
  
  // Forward tous les headers sauf ceux qui causent des conflits
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== "host" && lowerKey !== "content-length" && lowerKey !== "content-type") {
      forwardedHeaders.set(key, value);
    }
  });
  
  // Force les headers nécessaires pour le POST JSON
  forwardedHeaders.set("Content-Type", "application/json");

  const resolvedParams = await params;
  const user_id = getUserIdFromParams(resolvedParams);

  const res = await serverSessionFetch(`${IDENTITY_SERVICE_URL}/users/${user_id}/roles`, {
    method: "POST",
    headers: forwardedHeaders,
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