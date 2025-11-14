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

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path: '/versions',
    method: 'GET',
    mock: {
      status: 200,
      body: {
        status: 'success',
        versions: [
          {
            version_id: 'mock-version-uuid-1',
            file_id: 'mock-file-uuid',
            version_number: 1,
            size: 1024000,
            created_at: new Date().toISOString(),
            created_by: 'mock-user-uuid',
            status: 'approved',
            is_current: true,
          },
        ],
        total: 1,
      },
    },
  });
}
