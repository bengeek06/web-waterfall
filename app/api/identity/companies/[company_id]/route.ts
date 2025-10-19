/**
 * API route handlers for `/api/identity/companies/[company_id]`.
 *
 * GET:    Get company by ID
 * PUT:    Update company completely (full replacement)
 * PATCH:  Partially update company
 * DELETE: Delete company
 *
 * @module api/identity/companies/[company_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  const { company_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/companies/${company_id}`,
    method: 'GET',
    mock: identityMocks.companyById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  const { company_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/companies/${company_id}`,
    method: 'PUT',
    mock: identityMocks.companyUpdate
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  const { company_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/companies/${company_id}`,
    method: 'PATCH',
    mock: identityMocks.companyUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ company_id: string }> }
) {
  const { company_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/companies/${company_id}`,
    method: 'DELETE',
    mock: identityMocks.companyDelete
  });
}
