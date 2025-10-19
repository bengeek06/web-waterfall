/**
 * API route handlers for `/api/guardian/roles/[role_id]`.
 *
 * GET:    Get role by ID
 * PUT:    Update role completely (full replacement)
 * PATCH:  Partially update role
 * DELETE: Delete role
 *
 * @module api/guardian/roles/[role_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}`,
    method: 'GET',
    mock: guardianMocks.roleById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}`,
    method: 'PUT',
    mock: guardianMocks.roleUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}`,
    method: 'PATCH',
    mock: guardianMocks.roleUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}`,
    method: 'DELETE',
    mock: guardianMocks.roleDelete
  });
}
