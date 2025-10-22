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
