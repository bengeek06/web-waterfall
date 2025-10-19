/**
 * Handles requests to the `/api/identity/init-db` endpoint.
 *
 * GET: Returns whether the Identity Service has been initialized.
 * POST: Initialize the database with default data if not already done.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the identity service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/init-db',
    method: 'GET',
    mock: identityMocks.initDbGet
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/init-db',
    method: 'POST',
    mock: identityMocks.initDbPost
  });
}
