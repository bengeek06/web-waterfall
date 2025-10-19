/**
 * Handles GET requests to the `/api/identity/organization_units/[unit_id]/children` endpoint.
 *
 * Returns the list of child organization units for the given parent organization unit.
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
    path: `/organization_units/${unit_id}/children`,
    method: 'GET',
    mock: identityMocks.organizationUnitChildren
  });
}
