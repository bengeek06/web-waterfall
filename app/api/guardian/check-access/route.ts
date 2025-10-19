/**
 * Handles POST requests to the `/api/guardian/check-access` endpoint.
 *
 * Verify user access to specific resources.
 * Check if a user has permission to perform an operation on a resource.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the guardian service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/check-access',
    method: 'POST',
    mock: guardianMocks.checkAccess
  });
}
