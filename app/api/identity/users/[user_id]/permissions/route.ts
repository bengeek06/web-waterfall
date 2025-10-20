/**
 * Identity Service - User Permissions Route
 * GET /api/identity/users/{user_id}/permissions
 * 
 * Returns all permissions associated with a user's policies via Guardian Service.
 * 
 * This endpoint:
 * 1. Fetches all roles assigned to the user from Guardian
 * 2. For each role, fetches associated policies from Guardian
 * 3. For each policy, fetches associated permissions from Guardian
 * 4. Returns a deduplicated list of all permissions
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
    path: `/users/${user_id}/permissions`,
    method: 'GET',
    mock: identityMocks.userPermissions
  });
}
