/**
 * API route handlers for `/api/identity/organization_units/[unit_id]`.
 *
 * GET:    Get organization unit by ID
 * PUT:    Update organization unit completely (full replacement)
 * PATCH:  Partially update organization unit
 * DELETE: Delete organization unit
 *
 * @module api/identity/organization_units/[unit_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}`,
    method: 'GET',
    mock: identityMocks.organizationUnitById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}`,
    method: 'PUT',
    mock: identityMocks.organizationUnitUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}`,
    method: 'PATCH',
    mock: identityMocks.organizationUnitUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ unit_id: string }> }
) {
  const { unit_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/organization_units/${unit_id}`,
    method: 'DELETE',
    mock: identityMocks.organizationUnitDelete
  });
}
