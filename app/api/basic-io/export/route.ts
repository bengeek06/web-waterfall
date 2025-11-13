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
 * GET /api/basic-io/export
 * Export data from a Waterfall service endpoint
 * 
 * Query parameters:
 * - service: Target service name (identity, guardian, project, storage) - required
 * - path: Path within the service (e.g., /customers) - required
 * - type: Export format (json, csv, mermaid) - default: json
 * - enrich: Add reference metadata for intelligent import (true/false) - default: true
 * - tree: Convert flat list to nested tree structure (true/false) - default: false
 * - diagram_type: Type of Mermaid diagram (flowchart, graph, mindmap) - default: flowchart
 * - lookup_config: JSON string defining custom lookup fields
 * 
 * This endpoint translates the service name to the internal backend URL
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  
  // Get service and path from query params
  const serviceName = searchParams.get('service');
  const servicePath = searchParams.get('path');
  
  if (!serviceName || !servicePath) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: service and path' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Map service name to environment variable (use BASIC_IO_* variants for Docker access)
  const serviceEnvMap: Record<string, string> = {
    'identity': 'BASIC_IO_IDENTITY_SERVICE_URL',
    'guardian': 'BASIC_IO_GUARDIAN_SERVICE_URL',
    'project': 'BASIC_IO_PROJECT_SERVICE_URL',
    'storage': 'BASIC_IO_STORAGE_SERVICE_URL',
  };
  
  const serviceEnvVar = serviceEnvMap[serviceName.toLowerCase()];
  if (!serviceEnvVar) {
    return new Response(
      JSON.stringify({ error: `Unknown service: ${serviceName}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const serviceUrl = process.env[serviceEnvVar];
  if (!serviceUrl) {
    return new Response(
      JSON.stringify({ error: `Service URL not configured: ${serviceEnvVar}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Build the target URL for the backend service
  const targetUrl = `${serviceUrl}${servicePath}`;
  
  // Build new query params for basic-io service
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('url', targetUrl);
  newSearchParams.delete('service');
  newSearchParams.delete('path');
  
  return proxyRequest(req, {
    service: 'BASIC_IO_SERVICE_URL',
    path: `/export?${newSearchParams.toString()}`,
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
