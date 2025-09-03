import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to `/api/identity/companies`.
 */
export async function GET(req: NextRequest) {
  logger.info("GET request to /api/identity/companies");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock company list");
    return NextResponse.json([
      {
        company_id: "c1",
        name: "Acme Corp",
        description: "A leading provider of widgets.",
        address: "123 Main St",
        phone_number: "+33123456789",
        email: "contact@acme.com",
        website: "https://acme.com",
        logo_url: "https://logo.clearbit.com/acme.com",
        country: "France",
        city: "Paris",
        postal_code: "75001",
        created_at: "2024-01-01T09:00:00Z",
        updated_at: "2024-06-01T10:00:00Z"
      },
      {
        company_id: "c2",
        name: "Globex",
        description: "Global business solutions.",
        address: "456 Avenue de la République",
        phone_number: "+33612345678",
        email: "info@globex.com",
        website: "https://globex.com",
        logo_url: "https://logo.clearbit.com/globex.com",
        country: "France",
        city: "Lyon",
        postal_code: "69000",
        created_at: "2024-02-01T09:00:00Z",
        updated_at: "2024-06-02T11:00:00Z"
      },
      {
        company_id: "c3",
        name: "Initech",
        description: "Innovative tech for tomorrow.",
        address: "789 Rue de l'Innovation",
        phone_number: "+33555555555",
        email: "hello@initech.com",
        website: "https://initech.com",
        logo_url: "https://logo.clearbit.com/initech.com",
        country: "France",
        city: "Toulouse",
        postal_code: "31000",
        created_at: "2024-03-01T09:00:00Z",
        updated_at: "2024-06-03T12:00:00Z"
      }
    ]);
  }

  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json(
      { error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);
  logger.debug(`Request headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/companies`);

  const res = await fetch(`${IDENTITY_SERVICE_URL}/companies`, {
    method: "GET",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    credentials: "include",
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
 * Handles POST requests to `/api/identity/companies`.
 */
export async function POST(req: NextRequest) {
  logger.info("POST request to /api/identity/companies");

  if (process.env.MOCK_API === 'true') {
    logger.warn("Mocking identity service response");
    return NextResponse.json(
      {
        company_id: "c1",
        name: "Acme Corp",
        description: "A leading provider of widgets.",
        address: "123 Main St",
        phone_number: "+33123456789",
        email: "contact@acme.com",
        website: "https://acme.com",
        logo_url: "https://logo.clearbit.com/acme.com",
        country: "France",
        city: "Paris",
        postal_code: "75001",
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
  logger.debug(`Forwarding ${req.url} to ${IDENTITY_SERVICE_URL}/companies`);

  let body;
  try {
    body = await req.json();
    logger.debug(`POST body: ${JSON.stringify(body)}`);
  } catch (err) {
    logger.error(`Erreur lors du parsing du body JSON: ${err}`);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const res = await fetch(`${IDENTITY_SERVICE_URL}/companies`, {
    method: "POST",
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    body: JSON.stringify(body),
    credentials: "include",
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
