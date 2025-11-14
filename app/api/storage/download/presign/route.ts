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
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const path = queryString ? `/download/presign?${queryString}` : '/download/presign';

  return proxyRequest(req, {
    service: 'STORAGE_SERVICE_URL',
    path,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        status: 'success',
        download_url: 'https://minio:9000/mock-presigned-url',
        expires_in: 900,
        file_id: 'mock-uuid',
        filename: 'file.pdf',
        size: 1024,
      },
    },
  });
}
