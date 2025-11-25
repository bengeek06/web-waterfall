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
 * Handles requests to the `/api/identity/subcontractors/[subcontractor_id]/logo` endpoint.
 *
 * GET: Retrieve subcontractor logo image from Storage Service.
 * POST: Upload subcontractor logo (multipart/form-data).
 * DELETE: Remove subcontractor logo.
 * 
 * @param req - The incoming Next.js request object.
 * @param params - Route parameters containing subcontractor_id.
 * @returns A NextResponse object containing the proxied response from the identity service.
 */
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}/logo`,
    method: 'GET',
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}/logo`,
    method: 'POST',
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  const { subcontractor_id } = await params;
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/subcontractors/${subcontractor_id}/logo`,
    method: 'DELETE',
  });
}
