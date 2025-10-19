/**
 * API route handlers for `/api/identity/users/[user_id]/roles/[user_role_id]`.
 *
 * GET:    Get a specific user role
 * DELETE: Remove a role from a user (via Guardian Service RBAC)
 *
 * @module api/identity/users/[user_id]/roles/[user_role_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string; user_role_id: string }> }
) {
  const { user_id, user_role_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}/roles/${user_role_id}`,
    method: 'GET',
    mock: identityMocks.userRoleById
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string; user_role_id: string }> }
) {
  const { user_id, user_role_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}/roles/${user_role_id}`,
    method: 'DELETE',
    mock: identityMocks.userRoleDelete
  });
}
