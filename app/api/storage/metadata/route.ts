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
 * GET /api/storage/metadata
 * Get file metadata
 * 
 * Query parameters:
 * - bucket: Bucket type (users, companies, projects) - required
 * - id: Bucket ID (user_id, company_id, or project_id) - required
 * - logical_path: File path within bucket - required
 * - include_versions: Include version history (boolean) - optional, default: false
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const path = queryString ? `/metadata?${queryString}` : '/metadata';

  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        status: 'success',
        file_id: 'mock-uuid',
        bucket: 'users',
        path: '/documents/file.pdf',
        version: 1,
        size: 1024,
      },
    },
  });
}

/**
 * PATCH /api/storage/metadata
 * Update file metadata (tags, description)
 * 
 * Query parameters:
 * - bucket: Bucket type (users, companies, projects) - required
 * - id: Bucket ID - required
 * - logical_path: File path within bucket - required
 * 
 * Body: { tags?: object, description?: string }
 */
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const path = queryString ? `/metadata?${queryString}` : '/metadata';

  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path,
    method: 'PATCH',
    mock: {
      status: 200,
      body: {
        status: 'success',
        data: {
          file_id: 'mock-uuid',
          updated_fields: ['tags', 'description'],
        },
      },
    },
  });
}
