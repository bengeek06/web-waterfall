/**
 * Handles requests to the `/api/identity/users` endpoint.
 *
 * GET: Returns the list of all users for the authenticated company.
 * POST: Creates a new user with the provided data.
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
    path: '/users',
    method: 'GET',
    mock: identityMocks.users
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: '/users',
    method: 'POST',
    mock: identityMocks.userCreate
  });
}
