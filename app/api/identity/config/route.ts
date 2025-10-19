/**
 * Handles GET requests to the `/api/identity/config` endpoint.
 *
 * Returns current application configuration (non-sensitive data only).
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
    path: '/config',
    method: 'GET',
    mock: identityMocks.config
  });
}
