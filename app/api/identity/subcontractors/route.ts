/**
 * Handles requests to the `/api/identity/subcontractors` endpoint.
 *
 * GET: Returns the list of all subcontractors.
 * POST: Creates a new subcontractor with the provided data.
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
    path: '/subcontractors',
    method: 'GET',
    mock: identityMocks.subcontractors
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/subcontractors',
    method: 'POST',
    mock: identityMocks.subcontractorCreate
  });
}
