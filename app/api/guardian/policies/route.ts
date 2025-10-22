/**
 * API route handlers for `/api/guardian/policies`.
 *
 * GET:  List all policies
 * POST: Create a new policy
 *
 * @module api/guardian/policies/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/policies',
    method: 'GET',
    mock: guardianMocks.policies
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/policies',
    method: 'POST',
    mock: guardianMocks.policyCreate
  });
}
