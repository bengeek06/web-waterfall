/**
 * Handles requests to the `/api/guardian/init-db` endpoint.
 *
 * GET: Check database initialization status
 * POST: Initialize database with default permissions
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the guardian service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/init-db',
    method: 'GET',
    mock: guardianMocks.initDbGet
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/init-db',
    method: 'POST',
    mock: guardianMocks.initDbPost
  });
}
