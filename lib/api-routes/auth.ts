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
 * Authentication API routes
 * Centralized API endpoints for auth service
 */

const AUTH_BASE = '/api/auth';

export const AUTH_ROUTES = {
  login: `${AUTH_BASE}/login`,
  logout: `${AUTH_BASE}/logout`,
  refresh: `${AUTH_BASE}/refresh`,
  verify: `${AUTH_BASE}/verify`,
  register: `${AUTH_BASE}/register`,
  health: `${AUTH_BASE}/health`,
  version: `${AUTH_BASE}/version`,
  config: `${AUTH_BASE}/config`,
} as const;

// Type exports
export type AuthRoutes = typeof AUTH_ROUTES;
