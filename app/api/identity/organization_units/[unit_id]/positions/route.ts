/**
 * Handles requests to the `/api/identity/organization_units/[unit_id]/positions` endpoint.
 *
 * GET: Returns the list of positions associated with a specific organization unit.
 * POST: Creates a new position within the specified organization unit.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the identity service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}/positions`,
    method: 'GET',
    mock: identityMocks.positions
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}/positions`,
    method: 'POST',
    mock: identityMocks.positionCreate
  });
}
