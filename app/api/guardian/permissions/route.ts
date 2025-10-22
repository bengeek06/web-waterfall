/**
 * API route handlers for `/api/guardian/permissions`.
 *
 * GET: List all permissions (read-only)
 *
 * @module api/guardian/permissions/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/permissions',
    method: 'GET',
    mock: guardianMocks.permissions
  });
}