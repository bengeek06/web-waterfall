import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
export const dynamic = "force-dynamic";

function getCompanyIdFromParams(params: { company_id?: string }) {
  if (!params?.company_id) throw new Error("Missing company_id param");
  return params.company_id;
}

async function proxyRequest(
  req: NextRequest,
  method: string,
  company_id: string
) {
  logger.info(`${method} request to /api/identity/companies/${company_id}`);
  if (!IDENTITY_SERVICE_URL) {
    logger.error("IDENTITY_SERVICE_URL is not defined");
    return NextResponse.json({ error: "IDENTITY_SERVICE_URL is not defined" }, { status: 500 });
  }
  logger.debug(`Environment IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL}`);

  if (process.env.MOCK_API === 'true') {
    logger.warn("Running in development/test mode: returning mock company");
    if (method === "GET" || method === "PUT" || method === "PATCH") {
      return NextResponse.json({
        company_id,
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
      });
    } else if (method === "DELETE") {
      return NextResponse.json({ message: "Company deleted successfully" });
    } else {
      return NextResponse.json({ success: true });
    }
  }

  let body: string | undefined = undefined;
  if (["PUT", "PATCH"].includes(method)) {
    body = await req.text();
  }

  const res = await fetch(`${IDENTITY_SERVICE_URL}/companies/${company_id}`, {
    method,
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(([key]) => key.toLowerCase() !== "host")
    ),
    ...(body ? { body } : {}),
    credentials: "include",
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  const resolvedParams = await params;
  const company_id = getCompanyIdFromParams(resolvedParams);
  return proxyRequest(req, "GET", company_id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  const resolvedParams = await params;
  const company_id = getCompanyIdFromParams(resolvedParams);
  return proxyRequest(req, "PUT", company_id);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  const resolvedParams = await params;
  const company_id = getCompanyIdFromParams(resolvedParams);
  return proxyRequest(req, "PATCH", company_id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  const resolvedParams = await params;
  const company_id = getCompanyIdFromParams(resolvedParams);
  return proxyRequest(req, "DELETE", company_id);
}
