/**
 * API route handlers for `/api/identity/users/[user_id]/roles`.
 *
 * GET:  Get user roles (via Guardian Service RBAC)
 * POST: Assign a role to a user (via Guardian Service RBAC)
 *
 * @module api/identity/users/[user_id]/roles/route
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
    path: `/users/${user_id}/roles`,
    method: 'GET',
    mock: identityMocks.userRoles
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}/roles`,
    method: 'POST',
    mock: identityMocks.userRoleCreate
  });
}
