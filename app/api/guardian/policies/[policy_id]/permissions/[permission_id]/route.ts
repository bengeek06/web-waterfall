/**
 * API route handlers for `/api/guardian/policies/[policy_id]/permissions/[permission_id]`.
 *
 * This module proxies requests to the guardian service for policy-permission association operations.
 *
 * ## Supported HTTP methods:
 * - **DELETE**: Remove a permission from a specific policy.
 *
 * ## Implementation details:
 * - All requests are proxied to the backend guardian service using the unified `proxyRequest` function.
 * - Uses dynamic rendering (`force-dynamic`).
 *
 * @module api/guardian/policies/[policy_id]/permissions/[permission_id]/route
 */

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

export const dynamic = "force-dynamic";

/**
 * Handles DELETE requests to `/api/guardian/policies/[policy_id]/permissions/[permission_id]`.
 *
 * Proxies the request to the guardian service to remove a permission from a policy.
 *
 * @param req - The incoming Next.js request object.
 * @param params - The route parameters containing policy_id and permission_id.
 * @returns A NextResponse containing the proxied response from the guardian service.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ policy_id: string; permission_id: string }> }
) {
  const { policy_id, permission_id } = await params;
  
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: `/policies/${policy_id}/permissions/${permission_id}`,
    method: 'DELETE'
  });
}