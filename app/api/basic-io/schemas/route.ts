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
 * GET /api/basic-io/schemas
 * List all schema configurations for export/import operations
 * 
 * Query parameters:
 * - service: Filter schemas by service name (optional)
 * 
 * Returns schema configurations with:
 * - name: Resource name (e.g., "users", "roles")
 * - service: Service name (identity, guardian, project, etc.)
 * - endpoint: API endpoint path
 * - lookup_fields: Fields used for FK lookup during import
 * 
 * @see https://github.com/bengeek06/basic-io-api-waterfall/blob/develop/openapi.yml
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/schemas${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        schemas: [
          { name: 'users', service: 'identity', endpoint: 'users', lookup_fields: ['email', 'name'] },
          { name: 'customers', service: 'identity', endpoint: 'customers', lookup_fields: ['name'] },
          { name: 'subcontractors', service: 'identity', endpoint: 'subcontractors', lookup_fields: ['name'] },
          { name: 'roles', service: 'guardian', endpoint: 'roles', lookup_fields: ['name'] },
          { name: 'policies', service: 'guardian', endpoint: 'policies', lookup_fields: ['name'] },
        ],
        count: 5,
      },
    },
  });
}
