/**
 * Handles GET requests to the `/api/identity/version` endpoint.
 *
 * Returns the current version of the Identity Service API.
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
    path: '/version',
    method: 'GET',
    mock: identityMocks.version
  });
}