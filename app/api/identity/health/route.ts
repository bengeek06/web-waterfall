/**
 * Handles GET requests to the `/api/identity/health` endpoint.
 *
 * Returns comprehensive health information including database connectivity.
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
    path: '/health',
    method: 'GET',
    mock: identityMocks.health
  });
}
