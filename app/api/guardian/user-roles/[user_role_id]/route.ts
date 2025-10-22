/**
 * API route handlers for `/api/guardian/users-roles/[user_role_id]`.
 *
 * GET:    Get user-role association by ID
 * PUT:    Update user-role association completely (full replacement)
 * PATCH:  Partially update user-role association
 * DELETE: Delete user-role association
 *
 * @module api/guardian/users-roles/[user_role_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_role_id: string }> }
) {
  const { user_role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/user-roles/${user_role_id}`,
    method: 'GET',
    mock: guardianMocks.userRoleById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ user_role_id: string }> }
) {
  const { user_role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/user-roles/${user_role_id}`,
    method: 'PUT',
    mock: guardianMocks.userRoleUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ user_role_id: string }> }
) {
  const { user_role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/user-roles/${user_role_id}`,
    method: 'PATCH',
    mock: guardianMocks.userRoleUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user_role_id: string }> }
) {
  const { user_role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/user-roles/${user_role_id}`,
    method: 'DELETE',
    mock: guardianMocks.userRoleDelete
  });
}
