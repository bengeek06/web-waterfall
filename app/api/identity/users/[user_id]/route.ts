/**
 * API route handlers for `/api/identity/users/[user_id]`.
 *
 * GET:    Get user by ID
 * PUT:    Update user completely (full replacement)
 * PATCH:  Partially update user
 * DELETE: Delete user
 *
 * @module api/identity/users/[user_id]/route
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
    path: `/users/${user_id}`,
    method: 'GET',
    mock: identityMocks.userById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}`,
    method: 'PUT',
    mock: identityMocks.userUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}`,
    method: 'PATCH',
    mock: identityMocks.userUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${user_id}`,
    method: 'DELETE',
    mock: identityMocks.userDelete
  });
}
