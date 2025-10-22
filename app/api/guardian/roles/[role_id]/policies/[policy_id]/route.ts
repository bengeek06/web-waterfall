/**
 * API route handlers for `/api/guardian/roles/[role_id]/policies/[policy_id]`
 *
 * DELETE: Remove a specific policy from a role
 *
 * @module api/guardian/roles/[role_id]/policies/[policy_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ role_id: string; policy_id: string }> }
) {
  const { role_id, policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/roles/${role_id}/policies/${policy_id}`,
    method: 'DELETE',
    mock: guardianMocks.rolePolicyRemove
  });
}