/**
 * Handles GET requests to the `/api/auth/config` endpoint.
 * 
 * Returns the current application configuration including environment variables and settings.
 * 
 * Note: This endpoint may expose sensitive information and should be restricted 
 * to authorized users only in production environments.
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
    path: '/config',
    method: 'GET',
    mock: authMocks.config
  });
}
