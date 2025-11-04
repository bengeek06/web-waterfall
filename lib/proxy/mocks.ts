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
 * Centralized mock responses for all API endpoints
 * These mocks are used when MOCK_API=true
 */

import { MockResponse } from './types';

/**
 * Authentication service mocks
 */
export const authMocks = {
  login: {
    status: 200,
    body: {
      message: "Login successful",
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.mock-signature",
      refresh_token: "mock-refresh-token-a1B2c3D4e5F6g7H8i9J0",
      _dev_note: "Tokens visible in development mode only"
    },
    cookies: [
      "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.mock-signature; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
      "refresh_token=mock-refresh-token-a1B2c3D4e5F6g7H8i9J0; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    ]
  } as MockResponse,

  verify: {
    status: 200,
    body: {
      valid: true,
      user_id: "mock-user-id",
      email: "mock@test.com",
      company_id: "mock-company-id"
    }
  } as MockResponse,

  refresh: {
    status: 200,
    body: {
      message: "Token refreshed",
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.new-mock-signature",
      refresh_token: "new-mock-refresh-token-b2C3d4E5f6G7h8I9j0K1",
      _dev_note: "Tokens visible in development mode only"
    },
    cookies: [
      "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6Im1vY2tAdGVzdC5jb20iLCJjb21wYW55X2lkIjoibW9jay1jb21wYW55IiwiZXhwIjoxNzI4NzM0ODAwfQ.new-mock-signature; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
      "refresh_token=new-mock-refresh-token-b2C3d4E5f6G7h8I9j0K1; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    ]
  } as MockResponse,

  logout: {
    status: 200,
    body: {
      message: "Logout successful"
    },
    cookies: [
      "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      "refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    ]
  } as MockResponse,

  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "authentication",
      message: "Authentication service is running (mock)"
    }
  } as MockResponse,

  version: {
    status: 200,
    body: {
      version: "0.0.1-mock"
    }
  } as MockResponse,

  config: {
    status: 200,
    body: {
      FLASK_ENV: "development",
      DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
      LOG_LEVEL: "INFO",
      USER_SERVICE_URL: "http://mock-user-service:5002"
    }
  } as MockResponse
};

/**
 * Guardian service mocks
 */
export const guardianMocks = {
  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "guardian_service",
      message: "Guardian service is running (mock)",
      timestamp: "2025-10-19T12:00:00Z",
      version: "1.0.0",
      environment: "development",
      checks: {
        database: {
          healthy: true,
          message: "Database connection successful",
          response_time_ms: 5.2
        }
      }
    }
  } as MockResponse,

  version: {
    status: 200,
    body: {
      version: "1.0.0-mock"
    }
  } as MockResponse,

  config: {
    status: 200,
    body: {
      env: "development",
      debug: true,
      database_url: "postgresql://mock:****@localhost:5432/guardian_mock"
    }
  } as MockResponse,

  initDbGet: {
    status: 200,
    body: {
      initialized: true,
      message: "Database is already initialized"
    }
  } as MockResponse,

  initDbPost: {
    status: 200,
    body: {
      initialized: true,
      message: "Database initialized successfully with default permissions"
    }
  } as MockResponse,

  checkAccess: {
    status: 200,
    body: {
      access_granted: true,
      reason: "User has permission to read role resource",
      user_id: "mock-user-id",
      company_id: "mock-company-id",
      service: "guardian",
      resource_name: "role",
      operation: "read"
    }
  } as MockResponse,

  roles: {
    status: 200,
    body: [
      {
        id: "role-001",
        name: "Admin",
        description: "Administrator role with full access",
        company_id: "mock-company-id",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      },
      {
        id: "role-002",
        name: "User",
        description: "Standard user role",
        company_id: "mock-company-id",
        created_at: "2025-10-02T10:00:00Z",
        updated_at: "2025-10-02T10:00:00Z"
      }
    ]
  } as MockResponse,

  roleCreate: {
    status: 201,
    body: {
      id: "role-new",
      name: "Project Manager",
      description: "Can manage projects and teams",
      company_id: "mock-company-id",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  roleById: {
    status: 200,
    body: {
      id: "role-001",
      name: "Admin",
      description: "Administrator role with full access",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  roleUpdate: {
    status: 200,
    body: {
      id: "role-001",
      name: "Admin",
      description: "Updated administrator role",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  roleDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  rolePolicies: {
    status: 200,
    body: [
      {
        id: "policy-001",
        name: "Admin Policy",
        description: "Full access to all resources"
      },
      {
        id: "policy-002",
        name: "Read-Only Policy",
        description: "Read-only access to resources"
      }
    ]
  } as MockResponse,

  rolePolicyAdd: {
    status: 201,
    body: {
      message: "Policy added to role successfully"
    }
  } as MockResponse,

  rolePolicyRemove: {
    status: 204,
    body: ""
  } as MockResponse,

  policies: {
    status: 200,
    body: [
      {
        id: "policy-001",
        name: "Admin Policy",
        description: "Full access to all resources",
        company_id: "mock-company-id",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      },
      {
        id: "policy-002",
        name: "Read-Only Policy",
        description: "Read-only access to resources",
        company_id: "mock-company-id",
        created_at: "2025-10-02T10:00:00Z",
        updated_at: "2025-10-02T10:00:00Z"
      }
    ]
  } as MockResponse,

  policyCreate: {
    status: 201,
    body: {
      id: "policy-new",
      name: "Project Management Policy",
      description: "Permissions for project management operations",
      company_id: "mock-company-id",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  policyById: {
    status: 200,
    body: {
      id: "policy-001",
      name: "Admin Policy",
      description: "Full access to all resources",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  policyUpdate: {
    status: 200,
    body: {
      id: "policy-001",
      name: "Admin Policy",
      description: "Updated full access policy",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  policyDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  policyPermissions: {
    status: 200,
    body: [
      {
        id: "perm-001",
        service: "identity",
        resource_name: "user",
        operation: "read"
      },
      {
        id: "perm-002",
        service: "identity",
        resource_name: "user",
        operation: "write"
      }
    ]
  } as MockResponse,

  policyPermissionAdd: {
    status: 201,
    body: {
      message: "Permission added to policy successfully"
    }
  } as MockResponse,

  policyPermissionRemove: {
    status: 204,
    body: ""
  } as MockResponse,

  permissions: {
    status: 200,
    body: [
      {
        id: "perm-001",
        service: "guardian",
        resource_name: "role",
        description: "Manage roles",
        operations: ["list", "create", "read", "update", "delete"],
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      },
      {
        id: "perm-002",
        service: "guardian",
        resource_name: "policy",
        description: "Manage policies",
        operations: ["list", "create", "read", "update", "delete"],
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  permissionById: {
    status: 200,
    body: {
      id: "perm-001",
      service: "guardian",
      resource_name: "role",
      description: "Manage roles",
      operations: ["list", "create", "read", "update", "delete"],
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  userRoles: {
    status: 200,
    body: [
      {
        id: "ur-001",
        user_id: "user-001",
        role_id: "role-001",
        company_id: "mock-company-id",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  userRoleCreate: {
    status: 201,
    body: {
      id: "ur-new",
      user_id: "user-001",
      role_id: "role-002",
      company_id: "mock-company-id",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  userRoleById: {
    status: 200,
    body: {
      id: "ur-001",
      user_id: "user-001",
      role_id: "role-001",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  userRoleUpdate: {
    status: 200,
    body: {
      id: "ur-001",
      user_id: "user-001",
      role_id: "role-002",
      company_id: "mock-company-id",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  userRoleDelete: {
    status: 204,
    body: ""
  } as MockResponse
};

/**
 * Identity service mocks
 */
export const identityMocks = {
  // System endpoints
  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "identity_service",
      message: "Identity service is running (mock)",
      timestamp: "2025-10-19T12:00:00Z",
      version: "0.0.1",
      environment: "development",
      checks: {
        database: {
          healthy: true,
          message: "Database connection successful",
          response_time_ms: 4.8
        }
      }
    }
  } as MockResponse,

  version: {
    status: 200,
    body: {
      version: "0.0.1-mock"
    }
  } as MockResponse,

  config: {
    status: 200,
    body: {
      env: "development",
      debug: true,
      database_url: "postgresql://mock:****@localhost:5432/identity_mock"
    }
  } as MockResponse,

  initDbGet: {
    status: 200,
    body: {
      initialized: true,
      message: "Database is already initialized"
    }
  } as MockResponse,

  initDbPost: {
    status: 200,
    body: {
      initialized: true,
      message: "Database initialized successfully"
    }
  } as MockResponse,

  // Companies
  companies: {
    status: 200,
    body: [
      {
        id: "company-001",
        name: "Acme Corporation",
        description: "Leading technology company",
        logo_url: "https://example.com/logo.png",
        website: "https://acme.com",
        phone_number: "1234567890",
        email: "contact@acme.com",
        address: "123 Tech Street",
        postal_code: "12345",
        city: "Tech City",
        country: "USA",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  companyCreate: {
    status: 201,
    body: {
      id: "company-new",
      name: "New Company Inc",
      description: "A new company",
      logo_url: null,
      website: null,
      phone_number: null,
      email: "info@newcompany.com",
      address: null,
      postal_code: null,
      city: null,
      country: null,
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  companyById: {
    status: 200,
    body: {
      id: "company-001",
      name: "Acme Corporation",
      description: "Leading technology company",
      logo_url: "https://example.com/logo.png",
      website: "https://acme.com",
      phone_number: "1234567890",
      email: "contact@acme.com",
      address: "123 Tech Street",
      postal_code: "12345",
      city: "Tech City",
      country: "USA",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  companyUpdate: {
    status: 200,
    body: {
      id: "company-001",
      name: "Acme Corporation",
      description: "Updated technology company",
      logo_url: "https://example.com/logo.png",
      website: "https://acme.com",
      phone_number: "1234567890",
      email: "contact@acme.com",
      address: "123 Tech Street",
      postal_code: "12345",
      city: "Tech City",
      country: "USA",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  companyDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  // Users
  users: {
    status: 200,
    body: [
      {
        id: "user-001",
        email: "admin@example.com",
        first_name: "John",
        last_name: "Doe",
        phone_number: "+1234567890",
        avatar_url: "https://example.com/avatar.jpg",
        is_active: true,
        is_verified: true,
        last_login_at: "2025-10-19T10:00:00Z",
        company_id: "company-001",
        position_id: "position-001",
        language: "en",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  userCreate: {
    status: 201,
    body: {
      id: "user-new",
      email: "newuser@example.com",
      first_name: "Jane",
      last_name: "Smith",
      phone_number: null,
      avatar_url: null,
      is_active: true,
      is_verified: false,
      last_login_at: null,
      company_id: "company-001",
      position_id: null,
      language: "en",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  userById: {
    status: 200,
    body: {
      id: "user-001",
      email: "admin@example.com",
      first_name: "John",
      last_name: "Doe",
      phone_number: "+1234567890",
      avatar_url: "https://example.com/avatar.jpg",
      is_active: true,
      is_verified: true,
      last_login_at: "2025-10-19T10:00:00Z",
      company_id: "company-001",
      position_id: "position-001",
      language: "en",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  userUpdate: {
    status: 200,
    body: {
      id: "user-001",
      email: "admin@example.com",
      first_name: "John",
      last_name: "Doe Updated",
      phone_number: "+1234567890",
      avatar_url: "https://example.com/avatar.jpg",
      is_active: true,
      is_verified: true,
      last_login_at: "2025-10-19T10:00:00Z",
      company_id: "company-001",
      position_id: "position-001",
      language: "en",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  userDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  userRoles: {
    status: 200,
    body: {
      roles: [
        {
          id: "ur-001",
          user_id: "user-001",
          role_id: "role-001"
        }
      ]
    }
  } as MockResponse,

  userRoleCreate: {
    status: 201,
    body: {
      id: "ur-new",
      user_id: "user-001",
      role_id: "role-002"
    }
  } as MockResponse,

  userRoleById: {
    status: 200,
    body: {
      id: "ur-001",
      user_id: "user-001",
      role_id: "role-001"
    }
  } as MockResponse,

  userRoleDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  // Organization Units
  organizationUnits: {
    status: 200,
    body: [
      {
        id: "ou-001",
        name: "Engineering",
        company_id: "company-001",
        description: "Engineering department",
        parent_id: null,
        path: "/Engineering",
        level: 1,
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      },
      {
        id: "ou-002",
        name: "Backend Team",
        company_id: "company-001",
        description: "Backend development team",
        parent_id: "ou-001",
        path: "/Engineering/Backend Team",
        level: 2,
        created_at: "2025-10-02T10:00:00Z",
        updated_at: "2025-10-02T10:00:00Z"
      }
    ]
  } as MockResponse,

  organizationUnitCreate: {
    status: 201,
    body: {
      id: "ou-new",
      name: "Marketing",
      company_id: "company-001",
      description: "Marketing department",
      parent_id: null,
      path: "/Marketing",
      level: 1,
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  organizationUnitById: {
    status: 200,
    body: {
      id: "ou-001",
      name: "Engineering",
      company_id: "company-001",
      description: "Engineering department",
      parent_id: null,
      path: "/Engineering",
      level: 1,
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  organizationUnitUpdate: {
    status: 200,
    body: {
      id: "ou-001",
      name: "Engineering",
      company_id: "company-001",
      description: "Updated engineering department",
      parent_id: null,
      path: "/Engineering",
      level: 1,
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  organizationUnitDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  organizationUnitChildren: {
    status: 200,
    body: [
      {
        id: "ou-002",
        name: "Backend Team",
        company_id: "company-001",
        description: "Backend development team",
        parent_id: "ou-001",
        path: "/Engineering/Backend Team",
        level: 2,
        created_at: "2025-10-02T10:00:00Z",
        updated_at: "2025-10-02T10:00:00Z"
      }
    ]
  } as MockResponse,

  // Positions
  positions: {
    status: 200,
    body: [
      {
        id: "position-001",
        title: "Senior Developer",
        description: "Senior backend developer",
        company_id: "company-001",
        organization_unit_id: "ou-002",
        level: 5,
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  positionCreate: {
    status: 201,
    body: {
      id: "position-new",
      title: "Junior Developer",
      description: "Junior backend developer",
      company_id: "company-001",
      organization_unit_id: "ou-002",
      level: 2,
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  positionById: {
    status: 200,
    body: {
      id: "position-001",
      title: "Senior Developer",
      description: "Senior backend developer",
      company_id: "company-001",
      organization_unit_id: "ou-002",
      level: 5,
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  positionUpdate: {
    status: 200,
    body: {
      id: "position-001",
      title: "Senior Developer",
      description: "Updated senior backend developer",
      company_id: "company-001",
      organization_unit_id: "ou-002",
      level: 6,
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  positionDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  positionUsers: {
    status: 200,
    body: [
      {
        id: "user-001",
        email: "admin@example.com",
        first_name: "John",
        last_name: "Doe",
        position_id: "position-001",
        company_id: "company-001"
      }
    ]
  } as MockResponse,

  // Customers
  customers: {
    status: 200,
    body: [
      {
        id: "customer-001",
        name: "Big Client Corp",
        company_id: 1,
        email: "contact@bigclient.com",
        contact_person: "Alice Johnson",
        phone_number: "9876543210",
        address: "456 Client Avenue",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  customerCreate: {
    status: 201,
    body: {
      id: "customer-new",
      name: "New Customer LLC",
      company_id: 1,
      email: "info@newcustomer.com",
      contact_person: "Bob Smith",
      phone_number: "1112223333",
      address: "789 Customer Road",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  customerById: {
    status: 200,
    body: {
      id: "customer-001",
      name: "Big Client Corp",
      company_id: 1,
      email: "contact@bigclient.com",
      contact_person: "Alice Johnson",
      phone_number: "9876543210",
      address: "456 Client Avenue",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  customerUpdate: {
    status: 200,
    body: {
      id: "customer-001",
      name: "Big Client Corp",
      company_id: 1,
      email: "contact@bigclient.com",
      contact_person: "Alice Johnson Updated",
      phone_number: "9876543210",
      address: "456 Client Avenue",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  customerDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  // Subcontractors
  subcontractors: {
    status: 200,
    body: [
      {
        id: "sub-001",
        name: "Tech Solutions Ltd",
        company_id: "company-001",
        description: "Software development contractor",
        contact_person: "Charlie Brown",
        phone_number: "5554443333",
        email: "contact@techsolutions.com",
        address: "321 Contractor Street",
        created_at: "2025-10-01T10:00:00Z",
        updated_at: "2025-10-01T10:00:00Z"
      }
    ]
  } as MockResponse,

  subcontractorCreate: {
    status: 201,
    body: {
      id: "sub-new",
      name: "New Contractor Inc",
      company_id: "company-001",
      description: "New contracting company",
      contact_person: "David Lee",
      phone_number: "6665554444",
      email: "info@newcontractor.com",
      address: "654 Subcontractor Blvd",
      created_at: "2025-10-19T12:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  subcontractorById: {
    status: 200,
    body: {
      id: "sub-001",
      name: "Tech Solutions Ltd",
      company_id: "company-001",
      description: "Software development contractor",
      contact_person: "Charlie Brown",
      phone_number: "5554443333",
      email: "contact@techsolutions.com",
      address: "321 Contractor Street",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-01T10:00:00Z"
    }
  } as MockResponse,

  subcontractorUpdate: {
    status: 200,
    body: {
      id: "sub-001",
      name: "Tech Solutions Ltd",
      company_id: "company-001",
      description: "Updated software development contractor",
      contact_person: "Charlie Brown",
      phone_number: "5554443333",
      email: "contact@techsolutions.com",
      address: "321 Contractor Street",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-19T12:00:00Z"
    }
  } as MockResponse,

  subcontractorDelete: {
    status: 204,
    body: ""
  } as MockResponse,

  // Authentication
  verifyPassword: {
    status: 200,
    body: {
      valid: true,
      user: {
        id: "user-001",
        email: "admin@example.com",
        first_name: "John",
        last_name: "Doe",
        company_id: "company-001"
      }
    }
  } as MockResponse,

  verifyPasswordInvalid: {
    status: 403,
    body: {
      message: "User or password invalid"
    }
  } as MockResponse,

  // User Policies (aggregated from Guardian via roles)
  userPolicies: {
    status: 200,
    body: {
      policies: [
        {
          id: "policy-001",
          name: "Project Management Policy",
          description: "Permissions for project management operations",
          company_id: "company-001",
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
        },
        {
          id: "policy-002",
          name: "User Management Policy",
          description: "Permissions for user management operations",
          company_id: "company-001",
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
        }
      ]
    }
  } as MockResponse,

  // User Permissions (aggregated from Guardian via policies)
  userPermissions: {
    status: 200,
    body: {
      permissions: [
        {
          id: "perm-001",
          service: "identity",
          resource_name: "user",
          description: "Manage users",
          operations: ["create", "read", "update", "delete"],
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
        },
        {
          id: "perm-002",
          service: "identity",
          resource_name: "company",
          description: "Manage companies",
          operations: ["read", "update"],
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
        },
        {
          id: "perm-003",
          service: "guardian",
          resource_name: "role",
          description: "Manage roles",
          operations: ["create", "read", "update", "delete"],
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
        }
      ]
    }
  } as MockResponse
};
