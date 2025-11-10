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
 * GET /api/basic_io/export
 * Export data from a Waterfall service endpoint
 * 
 * Query parameters:
 * - url: Target Waterfall service endpoint URL to export from (required)
 * - type: Export format (json, csv, mermaid) - default: json
 * - enrich: Add reference metadata for intelligent import (true/false) - default: true
 * - tree: Convert flat list to nested tree structure (true/false) - default: false
 * - diagram_type: Type of Mermaid diagram (flowchart, graph, mindmap) - default: flowchart
 * - lookup_config: JSON string defining custom lookup fields
 */
export async function GET(req: NextRequest) {
  // Pass all query parameters through to the service
  const url = new URL(req.url);
  const queryString = url.search; // Includes the '?' prefix
  
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/export${queryString}`,
    method: 'GET',
    mock: {
      status: 200,
      body: { 
        message: 'Mock export endpoint',
        data: []
      },
    },
  });
}
