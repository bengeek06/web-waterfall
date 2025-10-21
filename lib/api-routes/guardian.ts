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
