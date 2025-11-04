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

import {
  matchesPermission,
  checkAndGroup,
  checkPermissions,
  getPermissionKey,
  findPermission,
  createPermissionConstants,
  PERMISSIONS,
  PERMISSION_REQUIREMENTS,
  type Permission,
  type PermissionCondition,
} from "./permissions";

describe("permissions utilities", () => {
  describe("matchesPermission", () => {
    it("should match exact permission", () => {
      const permission: Permission = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      const condition: PermissionCondition = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      expect(matchesPermission(permission, condition)).toBe(true);
    });

    it("should not match different service", () => {
      const permission: Permission = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      const condition: PermissionCondition = {
        service: "guardian",
        resource: "users",
        action: "list",
      };
      expect(matchesPermission(permission, condition)).toBe(false);
    });

    it("should not match different resource", () => {
      const permission: Permission = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      const condition: PermissionCondition = {
        service: "identity",
        resource: "companies",
        action: "list",
      };
      expect(matchesPermission(permission, condition)).toBe(false);
    });

    it("should not match different action", () => {
      const permission: Permission = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      const condition: PermissionCondition = {
        service: "identity",
        resource: "users",
        action: "create",
      };
      expect(matchesPermission(permission, condition)).toBe(false);
    });
  });

  describe("checkAndGroup", () => {
    it("should return true when all conditions are met", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ];
      const andGroup = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ];
      expect(checkAndGroup(permissions, andGroup)).toBe(true);
    });

    it("should return false when one condition is missing", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
      ];
      const andGroup = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ];
      expect(checkAndGroup(permissions, andGroup)).toBe(false);
    });

    it("should return true for empty AND group", () => {
      const permissions: Permission[] = [];
      const andGroup: PermissionCondition[] = [];
      expect(checkAndGroup(permissions, andGroup)).toBe(true);
    });

    it("should handle extra permissions", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
        { service: "identity", resource: "companies", action: "read" },
      ];
      const andGroup = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ];
      expect(checkAndGroup(permissions, andGroup)).toBe(true);
    });
  });

  describe("checkPermissions", () => {
    it("should return true when first OR group matches", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "list" },
      ];
      const requirements = [
        [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
        ],
      ];
      expect(checkPermissions(permissions, requirements)).toBe(true);
    });

    it("should return true when second OR group matches", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "companies", action: "read" },
      ];
      const requirements = [
        [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
        ],
        [{ service: "identity", resource: "companies", action: "read" }],
      ];
      expect(checkPermissions(permissions, requirements)).toBe(true);
    });

    it("should return false when no OR group matches", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
      ];
      const requirements = [
        [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
        ],
        [{ service: "identity", resource: "companies", action: "read" }],
      ];
      expect(checkPermissions(permissions, requirements)).toBe(false);
    });

    it("should return true for empty requirements", () => {
      const permissions: Permission[] = [];
      const requirements: PermissionCondition[][] = [];
      expect(checkPermissions(permissions, requirements)).toBe(true);
    });

    it("should handle complex OR of ANDs", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "companies", action: "update" },
      ];
      const requirements = [
        // (users:list AND roles:list) OR
        [
          { service: "identity", resource: "users", action: "list" },
          { service: "guardian", resource: "roles", action: "list" },
        ],
        // (companies:read) OR
        [{ service: "identity", resource: "companies", action: "read" }],
        // (companies:update)
        [{ service: "identity", resource: "companies", action: "update" }],
      ];
      expect(checkPermissions(permissions, requirements)).toBe(true);
    });
  });

  describe("PERMISSIONS constants", () => {
    it("should have correct structure for IDENTITY_USER_LIST", () => {
      expect(PERMISSIONS.IDENTITY_USER_LIST).toEqual({
        service: "identity",
        resource: "user",
        action: "list",
      });
    });

    it("should have correct structure for GUARDIAN_ROLE_LIST", () => {
      expect(PERMISSIONS.GUARDIAN_ROLE_LIST).toEqual({
        service: "guardian",
        resource: "role",
        action: "list",
      });
    });

    it("should have correct structure for IDENTITY_COMPANY_READ", () => {
      expect(PERMISSIONS.IDENTITY_COMPANY_READ).toEqual({
        service: "identity",
        resource: "company",
        action: "read",
      });
    });
  });

  describe("PERMISSION_REQUIREMENTS presets", () => {
    it("USER_ADMINISTRATION should require users:list OR roles:list", () => {
      const withBoth: Permission[] = [
        PERMISSIONS.IDENTITY_USER_LIST,
        PERMISSIONS.GUARDIAN_ROLE_LIST,
      ];
      expect(
        checkPermissions(withBoth, PERMISSION_REQUIREMENTS.USER_ADMINISTRATION)
      ).toBe(true);

      const withUsersOnly: Permission[] = [PERMISSIONS.IDENTITY_USER_LIST];
      expect(
        checkPermissions(
          withUsersOnly,
          PERMISSION_REQUIREMENTS.USER_ADMINISTRATION
        )
      ).toBe(true);

      const withRolesOnly: Permission[] = [PERMISSIONS.GUARDIAN_ROLE_LIST];
      expect(
        checkPermissions(
          withRolesOnly,
          PERMISSION_REQUIREMENTS.USER_ADMINISTRATION
        )
      ).toBe(true);

      const withNeither: Permission[] = [];
      expect(
        checkPermissions(
          withNeither,
          PERMISSION_REQUIREMENTS.USER_ADMINISTRATION
        )
      ).toBe(false);
    });

    it("COMPANY_SETTINGS should require companies:read OR companies:update", () => {
      const withRead: Permission[] = [PERMISSIONS.IDENTITY_COMPANY_READ];
      expect(
        checkPermissions(withRead, PERMISSION_REQUIREMENTS.COMPANY_SETTINGS)
      ).toBe(true);

      const withUpdate: Permission[] = [PERMISSIONS.IDENTITY_COMPANY_UPDATE];
      expect(
        checkPermissions(withUpdate, PERMISSION_REQUIREMENTS.COMPANY_SETTINGS)
      ).toBe(true);

      const withBoth: Permission[] = [
        PERMISSIONS.IDENTITY_COMPANY_READ,
        PERMISSIONS.IDENTITY_COMPANY_UPDATE,
      ];
      expect(
        checkPermissions(withBoth, PERMISSION_REQUIREMENTS.COMPANY_SETTINGS)
      ).toBe(true);

      const withNeither: Permission[] = [];
      expect(
        checkPermissions(withNeither, PERMISSION_REQUIREMENTS.COMPANY_SETTINGS)
      ).toBe(false);
    });
  });

  describe("getPermissionKey", () => {
    it("should generate correct key format", () => {
      const permission: Permission = {
        service: "identity",
        resource: "users",
        action: "list",
      };
      expect(getPermissionKey(permission)).toBe("identity.users.list");
    });
  });

  describe("findPermission", () => {
    const permissions: Permission[] = [
      { service: "identity", resource: "users", action: "list" },
      { service: "identity", resource: "users", action: "read" },
      { service: "guardian", resource: "roles", action: "list" },
    ];

    it("should find existing permission", () => {
      const found = findPermission(permissions, "identity", "users", "list");
      expect(found).toEqual({ service: "identity", resource: "users", action: "list" });
    });

    it("should return undefined for non-existing permission", () => {
      const found = findPermission(permissions, "identity", "companies", "read");
      expect(found).toBeUndefined();
    });
  });

  describe("createPermissionConstants", () => {
    it("should create constants with correct keys", () => {
      const permissions: Permission[] = [
        { service: "identity", resource: "users", action: "list" },
        { service: "guardian", resource: "roles", action: "create" },
      ];

      const constants = createPermissionConstants(permissions);

      expect(constants["IDENTITY_USERS_LIST"]).toEqual({
        service: "identity",
        resource: "users",
        action: "list",
      });
      expect(constants["GUARDIAN_ROLES_CREATE"]).toEqual({
        service: "guardian",
        resource: "roles",
        action: "create",
      });
    });

    it("should handle empty array", () => {
      const constants = createPermissionConstants([]);
      expect(Object.keys(constants).length).toBe(0);
    });
  });
});
