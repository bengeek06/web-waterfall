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
