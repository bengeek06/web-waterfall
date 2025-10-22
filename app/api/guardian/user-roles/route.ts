/**
 * API route handlers for `/api/guardian/users-roles`.
 *
 * GET:  List all user-role associations
 * POST: Create a new user-role association
 *
 * @module api/guardian/users-roles/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/user-roles',
    method: 'GET',
    mock: guardianMocks.userRoles
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/user-roles',
    method: 'POST',
    mock: guardianMocks.userRoleCreate
  });
}
