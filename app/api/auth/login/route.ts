/**
 * Handles POST requests to the login API route.
 *
 * This function acts as a proxy to the authentication service's `/login` endpoint.
 * It forwards the incoming request body and headers to the authentication service,
 * and relays the response back to the client.
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
    path: '/login',
    method: 'POST',
    mock: authMocks.login
  });
}