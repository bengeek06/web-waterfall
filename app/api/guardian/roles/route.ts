/**
 * API route handlers for `/api/guardian/roles`.
 *
 * GET:  List all roles within the authenticated company
 * POST: Create a new role within the authenticated company
 *
 * @module api/guardian/roles/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/roles',
    method: 'GET',
    mock: guardianMocks.roles
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/roles',
    method: 'POST',
    mock: guardianMocks.roleCreate
  });
}
