/**
 * API route handlers for `/api/guardian/policies/[policy_id]/permissions`
 *
 * GET:    List permissions attached to a policy
 * POST:   Add permissions to a policy
 * DELETE: Remove permissions from a policy
 *
 * @module api/guardian/policies/[policy_id]/permissions/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}/permissions`,
    method: 'GET',
    mock: guardianMocks.policyPermissions
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}/permissions`,
    method: 'POST',
    mock: guardianMocks.policyPermissionAdd
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}/permissions`,
    method: 'DELETE',
    mock: guardianMocks.policyPermissionRemove
  });
}
