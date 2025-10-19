/**
 * API route handlers for `/api/identity/customers/[customer_id]`.
 *
 * GET:    Get customer by ID
 * PUT:    Update customer completely (full replacement)
 * PATCH:  Partially update customer
 * DELETE: Delete customer
 *
 * @module api/identity/customers/[customer_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}`,
    method: 'GET',
    mock: identityMocks.customerById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}`,
    method: 'PUT',
    mock: identityMocks.customerUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}`,
    method: 'PATCH',
    mock: identityMocks.customerUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}`,
    method: 'DELETE',
    mock: identityMocks.customerDelete
  });
}
