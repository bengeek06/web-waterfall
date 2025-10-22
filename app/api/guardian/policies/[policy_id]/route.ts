/**
 * API route handlers for `/api/guardian/policies/[policy_id]`.
 *
 * GET:    Get policy by ID
 * PUT:    Update policy completely (full replacement)
 * PATCH:  Partially update policy
 * DELETE: Delete policy
 *
 * @module api/guardian/policies/[policy_id]/route
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
    path: `/policies/${policy_id}`,
    method: 'GET',
    mock: guardianMocks.policyById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}`,
    method: 'PUT',
    mock: guardianMocks.policyUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}`,
    method: 'PATCH',
    mock: guardianMocks.policyUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { policy_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}`,
    method: 'DELETE',
    mock: guardianMocks.policyDelete
  });
}
