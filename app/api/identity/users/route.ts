/**
 * API route handlers for `/api/identity/users`.
 *
 * This module proxies requests to the identity service for user-related operations.
 *
 * ## Supported HTTP methods:
 * - **GET**:    Fetch all users.
 * - **POST**:   Create a new user.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend identity service, using the `IDENTITY_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/identity/users/route
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkSessionAndFetch } from "@/lib/sessionFetch";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to `/api/identity/users`.
 *
 * Proxies the request to the identity service, forwarding all headers except "host".
 * Returns the response from the identity service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/identity/users");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock user list");
    return NextResponse.json([
      {
        id: "1",
        company_id: "c1",
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Smith",
        phone_number: "+33123456789",
        avatar_url: "https://randomuser.me/api/portraits/women/1.jpg",
        is_active: true,
        is_verified: true,
        role_id: "admin",
        position_id: "ceo",
        last_login_at: "2024-06-01T10:00:00Z",
        created_at: "2024-01-01T09:00:00Z",
        updated_at: "2024-06-01T10:00:00Z"
      },
      {
        id: "2",
        company_id: "c1",
        email: "bob@example.com",
        first_name: "Bob",
        last_name: "Brown",
        phone_number: "+33612345678",
        avatar_url: "https://randomuser.me/api/portraits/men/2.jpg",
        is_active: true,
        is_verified: false,
        role_id: "user",
        position_id: "dev",
        last_login_at: "2024-06-02T11:00:00Z",
        created_at: "2024-01-02T09:00:00Z",
        updated_at: "2024-06-02T11:00:00Z"
      },
      {
        id: "3",
        company_id: "c2",
        email: "carol@example.com",
        first_name: "Carol",
        last_name: "Johnson",
        phone_number: "+33765432109",
        avatar_url: "https://randomuser.me/api/portraits/women/3.jpg",
        is_active: false,
        is_verified: false,
        role_id: "user",
        position_id: "designer",
        last_login_at: "2024-05-30T08:00:00Z",
        created_at: "2024-01-03T09:00:00Z",
        updated_at: "2024-05-30T08:00:00Z"
      },
      {
        id: "4",
        company_id: "c2",
        email: "dave@example.com",
        first_name: "Dave",
        last_name: "Williams",
        phone_number: "+33987654321",
        avatar_url: "https://randomuser.me/api/portraits/men/4.jpg",
        is_active: true,
        is_verified: true,
        role_id: "manager",
        position_id: "cto",
        last_login_at: "2024-06-03T12:00:00Z",
        created_at: "2024-01-04T09:00:00Z",
        updated_at: "2024-06-03T12:00:00Z"
      },
      {
        id: "5",
        company_id: "c3",
        email: "eve@example.com",
        first_name: "Eve",
        last_name: "Davis",
        phone_number: "+33555555555",
        avatar_url: "https://randomuser.me/api/portraits/women/5.jpg",
        is_active: false,
        is_verified: true,
        role_id: "user",
        position_id: "intern",
        last_login_at: "2024-05-29T07:00:00Z",
        created_at: "2024-01-05T09:00:00Z",
        updated_at: "2024-05-29T07:00:00Z"
      }
    ]);
  }

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

  const res = await checkSessionAndFetch(`${IDENTITY_SERVICE_URL}/users`, {
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
 * Handles POST requests to `/api/identity/users`.
 *
 * Proxies the request body and headers to the identity service and returns the response.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/identity/users");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development mode");
    return NextResponse.json(
      {
        id: "1",
        company_id: "c1",
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Smith",
        phone_number: "+33123456789",
        avatar_url: "https://randomuser.me/api/portraits/women/1.jpg",
        is_active: true,
        is_verified: true,
        role_id: "admin",
        position_id: "ceo",
        last_login_at: "2024-06-01T10:00:00Z",
        created_at: "2024-01-01T09:00:00Z",
        updated_at: "2024-06-01T10:00:00Z"
      }
    );
  }

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/users`);

  let body;
  try {
    body = await req.json();
    logger.debug(`POST body: ${JSON.stringify(body)}`);
  } catch (err) {
    logger.error(`Erreur lors du parsing du body JSON: ${err}`);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(
      ([key]) => key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length"
    )
  );

  const res = await checkSessionAndFetch(`${IDENTITY_SERVICE_URL}/users`, {
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