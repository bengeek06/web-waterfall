/**
 * Handles GET requests to the `/api/guardian/config` endpoint.
 *
 * Returns current application configuration (non-sensitive data only).
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
    path: '/config',
    method: 'GET',
    mock: guardianMocks.config
  });
}
