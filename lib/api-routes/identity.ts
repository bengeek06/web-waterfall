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
 * Identity API routes
 * Centralized API endpoints for identity service
 */

const IDENTITY_BASE = '/api/identity';

export const IDENTITY_ROUTES = {
  // Users
  users: `${IDENTITY_BASE}/users`,
  user: (userId: string) => `${IDENTITY_BASE}/users/${userId}`,
  userRoles: (userId: string) => `${IDENTITY_BASE}/users/${userId}/roles`,
  userRole: (userId: string, roleId: string) => `${IDENTITY_BASE}/users/${userId}/roles/${roleId}`,
  userPolicies: (userId: string) => `${IDENTITY_BASE}/users/${userId}/policies`,
  userPermissions: (userId: string) => `${IDENTITY_BASE}/users/${userId}/permissions`,
  
  // Companies
  companies: `${IDENTITY_BASE}/companies`,
  company: (companyId: string) => `${IDENTITY_BASE}/companies/${companyId}`,
  
  // Organization Units
  organizationUnits: `${IDENTITY_BASE}/organization_units`,
  organizationUnit: (unitId: string) => `${IDENTITY_BASE}/organization_units/${unitId}`,
  organizationUnitChildren: (unitId: string) => `${IDENTITY_BASE}/organization_units/${unitId}/children`,
  organizationUnitPositions: (unitId: string) => `${IDENTITY_BASE}/organization_units/${unitId}/positions`,
  
  // Positions
  positions: `${IDENTITY_BASE}/positions`,
  position: (positionId: string) => `${IDENTITY_BASE}/positions/${positionId}`,
  positionUsers: (positionId: string) => `${IDENTITY_BASE}/positions/${positionId}/users`,
  
  // Customers
  customers: `${IDENTITY_BASE}/customers`,
  customer: (customerId: string) => `${IDENTITY_BASE}/customers/${customerId}`,
  
  // Subcontractors
  subcontractors: `${IDENTITY_BASE}/subcontractors`,
  subcontractor: (subcontractorId: string) => `${IDENTITY_BASE}/subcontractors/${subcontractorId}`,
  
  // System
  verifyPassword: `${IDENTITY_BASE}/verify_password`,
  health: `${IDENTITY_BASE}/health`,
  version: `${IDENTITY_BASE}/version`,
  config: `${IDENTITY_BASE}/config`,
  initDb: `${IDENTITY_BASE}/init-db`,
  initApp: `${IDENTITY_BASE}/init-app`,
} as const;

// Type exports
export type IdentityRoutes = typeof IDENTITY_ROUTES;
