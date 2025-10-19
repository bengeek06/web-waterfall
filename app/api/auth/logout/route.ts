/**
 * Handles POST requests to the `/api/auth/logout` endpoint.
 *
 * Blacklists the access token, deletes the refresh token, and clears authentication cookies.
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
    path: '/logout',
    method: 'POST',
    mock: authMocks.logout
  });
}