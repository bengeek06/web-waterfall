/**
 * API route handlers for `/api/guardian/permissions/[permission_id]`.
 *
 * GET: Get permission by ID (read-only)
 *
 * @module api/guardian/permissions/[permission_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ permission_id: string }> }
) {
  const { permission_id } = await params;
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/permissions/${permission_id}`,
    method: 'GET',
    mock: guardianMocks.permissionById
  });
}
