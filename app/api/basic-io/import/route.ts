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
 * Query parameters:
 * - url: Target Waterfall service endpoint URL to import to (required)
 * - type: Import format (json, csv, mermaid) - default: json
 * - resolve_foreign_keys: Resolve FK references using enriched metadata (true/false) - default: true
 * - skip_on_ambiguous: Skip records with ambiguous references (true/false) - default: true
 * - skip_on_missing: Skip records with missing references (true/false) - default: true
 * - detect_cycles: Detect circular parent references in tree structures (true/false) - default: true
 * 
 * Body: multipart/form-data with 'file' field
 */
export async function POST(req: NextRequest) {
  // Pass all query parameters through to the service
  const url = new URL(req.url);
  const queryString = url.search; // Includes the '?' prefix
  
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/import${queryString}`,
    method: 'POST',
    mock: {
      status: 200,
      body: { 
        total_records: 0,
        successful_imports: 0,
        failed_imports: 0,
        auto_resolved_references: 0,
        ambiguous_references: 0,
        missing_references: 0,
        id_mapping: {},
        reference_resolutions: [],
        errors: [],
        warnings: [],
        duration_seconds: 0
      },
    },
  });
}
