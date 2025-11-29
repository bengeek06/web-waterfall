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

import { NextResponse } from 'next/server';

/**
 * List of backend services with their version endpoints
 * This is the single source of truth for all backend services
 */
export const BACKEND_SERVICES = [
  { name: 'Auth Service', endpoint: '/api/auth/version' },
  { name: 'Identity Service', endpoint: '/api/identity/version' },
  { name: 'Guardian Service', endpoint: '/api/guardian/version' },
  { name: 'Storage Service', endpoint: '/api/storage/version' },
  { name: 'Basic I/O Service', endpoint: '/api/basic-io/version' },
  { name: 'Project Service', endpoint: '/api/project/version' },
] as const;

export type BackendService = typeof BACKEND_SERVICES[number];

/**
 * GET /api/services
 * Returns the list of backend services with their version endpoints
 */
export async function GET() {
  return NextResponse.json({ services: BACKEND_SERVICES });
}
