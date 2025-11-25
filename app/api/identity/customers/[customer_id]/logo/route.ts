/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

/**
 * Handles requests to the `/api/identity/customers/[customer_id]/logo` endpoint.
 *
 * GET: Retrieve customer logo image from Storage Service.
 * POST: Upload customer logo (multipart/form-data).
 * DELETE: Remove customer logo.
 * 
 * @param req - The incoming Next.js request object.
 * @param params - Route parameters containing customer_id.
 * @returns A NextResponse object containing the proxied response from the identity service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}/logo`,
    method: 'GET',
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}/logo`,
    method: 'POST',
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  const { customer_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/customers/${customer_id}/logo`,
    method: 'DELETE',
  });
}
