/**
 * API route handlers for `/api/identity/subcontractors/[subcontractor_id]`.
 *
 * GET:    Get subcontractor by ID
 * PUT:    Update subcontractor completely (full replacement)
 * PATCH:  Partially update subcontractor
 * DELETE: Delete subcontractor
 *
 * @module api/identity/subcontractors/[subcontractor_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}`,
    method: 'GET',
    mock: identityMocks.subcontractorById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}`,
    method: 'PUT',
    mock: identityMocks.subcontractorUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}`,
    method: 'PATCH',
    mock: identityMocks.subcontractorUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}`,
    method: 'DELETE',
    mock: identityMocks.subcontractorDelete
  });
}
