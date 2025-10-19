/**
 * Handles POST requests to the `/api/auth/refresh` endpoint.
 * 
 * Issues a new JWT access token using a valid refresh token.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A `NextResponse` object containing the proxied response from the authentication service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { authMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'AUTH_SERVICE_URL',
    path: '/refresh',
    method: 'POST',
    mock: authMocks.refresh
  });
}