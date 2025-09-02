/**
 * API route handler for `/api/identity/init-app`.
 *
 * This module proxies GET requests to the identity service to initialize the database.
 *
 * ## Supported HTTP methods:
 * - **GET**: Check initialization status of the identity service database.
 * - **POST**: Initialize the identity service database. Create initial data.
 *
 *
 * ## Implementation details:
 * - All requests are proxied to the backend identity service, using the `IDENTITY_SERVICE_URL` environment variable.
 * - All headers except `host` are forwarded.
 * - Handles both JSON and non-JSON responses from the backend.
 * - Logs request details for debugging and traceability.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/identity/init-app/route
 */
import { NextResponse, NextRequest } from "next/server";
import logger from "@/lib/logger";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to `/api/identity/init-app`.
 *
 * Proxies the request to the identity service.
 * Returns the response from the identity service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function GET(req: Request) {
    logger.info("GET request to /api/identity/init-app");

    if (process.env.NODE_ENV == "development") {
        logger.warn("Running in development mode: returning initialized: false");
        return NextResponse.json({ initialized: false });
    }

    if (!IDENTITY_SERVICE_URL) {
        logger.error("IDENTITY_SERVICE_URL is not defined");
        return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
    }
    logger.debug(`Identity service URL: ${IDENTITY_SERVICE_URL}`);
    logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
    logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/init-db`);

    const response = await fetch(`${IDENTITY_SERVICE_URL}/init-db`, {
        method: "GET",
        headers: Object.fromEntries(
            Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
        ),
        credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    let nextRes;
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        logger.debug(`Response data: ${JSON.stringify(data)}`);
        nextRes = NextResponse.json(data, { status: response.status });
    } else {
        const text = await response.text();
        logger.debug(`Response text: ${text}`);
        nextRes = new NextResponse(text, { status: response.status });
    }
  return nextRes;
}

/**
 * Handles POST requests to `/api/identity/init_db`.
 *
 * Proxies the request body to the identity service.
 * Returns the response from the identity service, preserving the status code and content type.
 *
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse containing the proxied response from the identity service.
 */
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/identity/init_db");

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL:${IDENTITY_SERVICE_URL}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/init-db`);

  let body;
  try {
    body = await req.json();
    logger.debug(`POST body: ${JSON.stringify(body)}`);
  } catch (err) {
    logger.error(`Erreur lors du parsing du body JSON: ${err}`);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const res = await fetch(`${IDENTITY_SERVICE_URL}/init-db`, {
    method: "POST",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    body: JSON.stringify(body),
    credentials: "include",
  });

  const setCookie = res.headers.get("set-cookie");
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
  if (setCookie) nextRes.headers.set("set-cookie", setCookie);
  return nextRes;
}