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

interface RouteParams {
  params: Promise<{ name: string }>;
}

/**
 * GET /api/basic-io/schemas/[name]
 * Get a specific schema configuration by name
 * 
 * Returns schema configuration with:
 * - name: Resource name (e.g., "users", "roles")
 * - service: Service name (identity, guardian, project, etc.)
 * - endpoint: API endpoint path
 * - lookup_fields: Fields used for FK lookup during import
 * - description: Human-readable description
 * 
 * @see https://github.com/bengeek06/basic-io-api-waterfall/blob/develop/openapi.yml
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { name } = await params;
  
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/schemas/${encodeURIComponent(name)}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        name,
        service: 'identity',
        endpoint: name,
        lookup_fields: ['name', 'email'],
        description: `Schema for ${name}`,
        is_active: true,
      },
    },
  });
}
