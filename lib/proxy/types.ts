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

/**
 * Types for the proxy system
 */

/**
 * Configuration for a proxy request
 */
export interface ProxyConfig {
  /** Environment variable name for the service URL (e.g., 'AUTH_SERVICE_URL') */
  service: string;
  /** The path to append to the service URL (e.g., '/login') */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Mock response to return when MOCK_API=true */
  mock?: MockResponse;
}

/**
 * Mock response structure
 */
export interface MockResponse {
  /** HTTP status code */
  status: number;
  /** Response body (will be JSON stringified) */
  body: Record<string, unknown> | string | Array<unknown>;
  /** Optional Set-Cookie headers to include */
  cookies?: string[];
  /** Optional additional headers */
  headers?: Record<string, string>;
}
