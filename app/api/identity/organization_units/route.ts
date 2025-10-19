/**
 * Handles requests to the `/api/identity/organization_units` endpoint.
 *
 * GET: Returns the list of all organization units.
 * POST: Creates a new organization unit with the provided data.
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
    path: '/organization_units',
    method: 'GET',
    mock: identityMocks.organizationUnits
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/organization_units',
    method: 'POST',
    mock: identityMocks.organizationUnitCreate
  });
}
