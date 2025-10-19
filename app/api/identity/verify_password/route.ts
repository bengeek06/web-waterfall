/**
 * Handles POST requests to the `/api/identity/verify_password` endpoint.
 *
 * Verifies if the provided password matches the user's password.
 * Used by Authentication Service to create tokens.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the identity service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/verify_password',
    method: 'POST',
    mock: identityMocks.verifyPassword
  });
}
