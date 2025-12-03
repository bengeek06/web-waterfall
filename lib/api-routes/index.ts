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
 * Centralized API routes
 * Import from here to access all API endpoints
 */

export * from './auth';
export * from './identity';
export * from './guardian';
export * from './storage';
export * from './basic_io';

// ==================== SERVICE ROUTE BUILDER ====================

/**
 * Service base paths mapping
 */
const SERVICE_BASES: Record<string, string> = {
  identity: '/api/identity',
  guardian: '/api/guardian',
  project: '/api/project',
  storage: '/api/storage',
  basic_io: '/api/basic-io',
};

/**
 * Build a complete API route for a given service and path
 * 
 * @param service - The service name (identity, guardian, project, storage, basic_io)
 * @param path - The path within the service (e.g., /users, /roles/{id}/policies)
 * @returns The complete API URL
 * 
 * @example
 * ```ts
 * getServiceRoute('identity', '/users')
 * // => '/api/identity/users'
 * 
 * getServiceRoute('guardian', '/users/123/roles')
 * // => '/api/guardian/users/123/roles'
 * ```
 */
export function getServiceRoute(service: string, path: string): string {
  const base = SERVICE_BASES[service];
  
  if (!base) {
    console.warn(`Unknown service: ${service}, falling back to direct path`);
    return path.startsWith('/') ? `/api/${service}${path}` : `/api/${service}/${path}`;
  }
  
  // Ensure path doesn't start with duplicate slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${normalizedPath}`;
}
