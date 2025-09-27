import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkSessionAndFetch } from "@/lib/sessionFetch";
import { cookies } from "next/headers";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

// GET /api/guardian/policies
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/guardian/policies");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock policies");
    return NextResponse.json([
      {
        id: "1",
        name: "Admin",
        permissions: [],
      },
      {
        id: "2",
        name: "User",
        permissions: [],
      }
    ]);
  }

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.debug(`Environment GUARDIAN_SERVICE_URL: ${GUARDIAN_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${GUARDIAN_SERVICE_URL}`);

  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  logger.debug(`Forwarded cookie header: ${headers.Cookie}`);

  const res = await checkSessionAndFetch(`${GUARDIAN_SERVICE_URL}/policies`, {
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

// POST /api/guardian/policies
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/guardian/policies");

  if (!GUARDIAN_SERVICE_URL) {
    logger.error("GUARDIAN_SERVICE_URL is not defined");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
  );
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  logger.debug(`Forwarded cookie header: ${headers.Cookie}`);

  const body = await req.text();

  const res = await checkSessionAndFetch(`${GUARDIAN_SERVICE_URL}/policies`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body,
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
