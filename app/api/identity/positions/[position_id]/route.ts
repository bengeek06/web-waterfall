/**
 * API route handlers for `/api/identity/positions/[position_id]`.
 *
 * GET:    Get position by ID
 * PUT:    Update position completely (full replacement)
 * PATCH:  Partially update position
 * DELETE: Delete position
 *
 * @module api/identity/positions/[position_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ position_id: string }> }
) {
  const { position_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/positions/${position_id}`,
    method: 'GET',
    mock: identityMocks.positionById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ position_id: string }> }
) {
  const { position_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/positions/${position_id}`,
    method: 'PUT',
    mock: identityMocks.positionUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ position_id: string }> }
) {
  const { position_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/positions/${position_id}`,
    method: 'PATCH',
    mock: identityMocks.positionUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ position_id: string }> }
) {
  const { position_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/positions/${position_id}`,
    method: 'DELETE',
    mock: identityMocks.positionDelete
  });
}
