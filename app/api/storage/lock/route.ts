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

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path: '/lock',
    method: 'POST',
    mock: {
      status: 200,
      body: {
        status: 'success',
        message: 'File locked successfully',
        file_id: 'mock-uuid',
        locked_by: 'mock-user-uuid',
      },
    },
  });
}
