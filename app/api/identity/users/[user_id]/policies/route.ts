/**
 * Identity Service - User Policies Route
 * GET /api/identity/users/{user_id}/policies
 * 
 * Returns all policies associated with a user's roles via Guardian Service.
 * 
 * This endpoint:
 * 1. Fetches all roles assigned to the user from Guardian
 * 2. For each role, fetches associated policies from Guardian
 * 3. Returns a deduplicated list of all policies
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}/policies`,
    method: 'GET',
    mock: identityMocks.userPolicies
  });
}
