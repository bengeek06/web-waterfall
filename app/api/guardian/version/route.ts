/**
 * Handles GET requests to the `/api/guardian/version` endpoint.
 *
 * Returns the current version of the Guardian Service API.
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
    path: '/version',
    method: 'GET',
    mock: guardianMocks.version
  });
}