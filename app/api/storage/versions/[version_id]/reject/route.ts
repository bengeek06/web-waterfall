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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ version_id: string }> }
) {
  const { version_id } = await params;

  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path: `/versions/${version_id}/reject`,
    method: 'POST',
    mock: {
      status: 200,
      body: {
        status: 'success',
        message: 'Version rejected successfully',
        version_id: version_id,
        rejected_at: new Date().toISOString(),
      },
    },
  });
}
