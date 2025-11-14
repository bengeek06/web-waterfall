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
 * Guardian API routes
 * Centralized API endpoints for guardian (RBAC) service
 */

const GUARDIAN_BASE = '/api/guardian';

export const GUARDIAN_ROUTES = {
  // Access Control
  checkAccess: `${GUARDIAN_BASE}/check-access`,
  
  // Roles
  roles: `${GUARDIAN_BASE}/roles`,
  role: (roleId: string) => `${GUARDIAN_BASE}/roles/${roleId}`,
  rolePolicies: (roleId: string) => `${GUARDIAN_BASE}/roles/${roleId}/policies`,
  rolePolicy: (roleId: string, policyId: string) => `${GUARDIAN_BASE}/roles/${roleId}/policies/${policyId}`,
  
  // Policies
  policies: `${GUARDIAN_BASE}/policies`,
  policy: (policyId: string) => `${GUARDIAN_BASE}/policies/${policyId}`,
  policyPermissions: (policyId: string) => `${GUARDIAN_BASE}/policies/${policyId}/permissions`,
  policyPermission: (policyId: string, permissionId: string) => 
    `${GUARDIAN_BASE}/policies/${policyId}/permissions/${permissionId}`,
  
  // Permissions
  permissions: `${GUARDIAN_BASE}/permissions`,
  permission: (permissionId: string) => `${GUARDIAN_BASE}/permissions/${permissionId}`,
  
  // User Roles
  userRoles: `${GUARDIAN_BASE}/user-roles`,
  userRole: (userRoleId: string) => `${GUARDIAN_BASE}/user-roles/${userRoleId}`,
  
  // System
  health: `${GUARDIAN_BASE}/health`,
  version: `${GUARDIAN_BASE}/version`,
  config: `${GUARDIAN_BASE}/config`,
  initDb: `${GUARDIAN_BASE}/init-db`,
  initApp: `${GUARDIAN_BASE}/init-app`,
} as const;

// Type exports
export type GuardianRoutes = typeof GUARDIAN_ROUTES;
