/**
 * Handles GET requests to the `/api/identity/positions/[position_id]/users` endpoint.
 *
 * Returns the list of users associated with a specific position.
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
  { params }: { params: Promise<{ position_id: string }> }
) {
  const { position_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/positions/${position_id}/users`,
    method: 'GET',
    mock: identityMocks.positionUsers
  });
}
