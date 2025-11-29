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

import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

/**
 * POST /api/basic-io/import
 * Import data from file to a Waterfall service endpoint
 * 
 * Query parameters (passed through to basic-io service):
 * - service: Target service name (identity, guardian, project, storage, diagram) - required
 * - endpoint: API endpoint path (e.g., users, customers) - required
 * - type: Import file format (json, csv) - default: json
 * - resolve_refs: Resolve FK references using _references metadata (true/false) - default: true
 * - on_ambiguous: Behavior for multiple FK matches (skip, fail) - default: skip
 * - on_missing: Behavior for missing FK matches (skip, fail) - default: skip
 * - associations_mode: How to handle M2M associations (skip, merge, recreate) - default: skip
 * 
 * Body: multipart/form-data with 'file' field
 * 
 * @see https://github.com/bengeek06/basic-io-api-waterfall/blob/develop/openapi.yml
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  
  // Validate required parameters
  const service = searchParams.get('service');
  const endpoint = searchParams.get('endpoint');
  
  if (!service || !endpoint) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: service and endpoint' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Validate service name
  const validServices = ['identity', 'guardian', 'project', 'storage', 'diagram'];
  if (!validServices.includes(service.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Unknown service: ${service}. Valid services: ${validServices.join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Pass all query params directly to basic-io (it handles service+endpoint resolution)
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/import?${searchParams.toString()}`,
    method: 'POST',
    mock: {
      status: 200,
      body: { 
        import_report: {
          total: 0,
          success: 0,
          failed: 0,
          id_mapping: {},
          errors: [],
        }
      },
    },
  });
}
