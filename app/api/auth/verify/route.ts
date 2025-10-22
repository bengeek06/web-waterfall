/**
 * Handles GET requests to verify authentication by proxying the request to the AUTH_SERVICE_URL.
 * 
 * Verifies the validity of the JWT access token from the cookies.
 * 
 * @param req - The incoming Next.js request object.
 * @returns A NextResponse object containing the proxied response from the authentication service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { authMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'AUTH_SERVICE_URL',
    path: '/verify',
    method: 'GET',
    mock: authMocks.verify
  });
}