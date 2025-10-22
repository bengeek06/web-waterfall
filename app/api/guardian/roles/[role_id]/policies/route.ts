/**
 * API route handlers for `/api/guardian/roles/[role_id]/policies`
 *
 * GET:    List policies attached to a role
 * POST:   Add policies to a role
 * DELETE: Remove policies from a role
 *
 * @module api/guardian/roles/[role_id]/policies/route
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
    path: `/roles/${role_id}/policies`,
    method: 'GET',
    mock: guardianMocks.rolePolicies
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}/policies`,
    method: 'POST',
    mock: guardianMocks.rolePolicyAdd
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string }> }
) {
  const { role_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}/policies`,
    method: 'DELETE',
    mock: guardianMocks.rolePolicyRemove
  });
}