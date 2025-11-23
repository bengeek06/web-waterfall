/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/users/[user_id]/permissions` handlers.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/identity/users/[user_id]/permissions", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  const USER_ID = "usr-001";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: `http://localhost:3000/api/identity/users/${USER_ID}/permissions`,
      headers: {
        entries: jest.fn().mockReturnValue([]),
        append: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        getSetCookie: jest.fn(),
        has: jest.fn(),
        set: jest.fn(),
        forEach: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        [Symbol.iterator]: jest.fn(),
      },
    } as Partial<NextRequest>;
  };

  const buildContext = () => ({
    params: Promise.resolve({ user_id: USER_ID })
  });

  describe("MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock permissions list aggregated from Guardian", async () => {
      const req = buildReq();
      const context = buildContext();
      const res = await GETFn(req as unknown as NextRequest, context);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toHaveProperty("permissions");
      expect(Array.isArray(json.permissions)).toBe(true);
      expect(json.permissions.length).toBeGreaterThan(0);
      expect(json.permissions[0]).toHaveProperty("id");
      expect(json.permissions[0]).toHaveProperty("service");
      expect(json.permissions[0]).toHaveProperty("resource_name");
      expect(json.permissions[0]).toHaveProperty("operation");
      expect(typeof json.permissions[0].operation).toBe("string");
    });
  });

  describe("MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns user permissions from Guardian", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = {
          permissions: [
            {
              id: "perm-001",
              service: "identity",
              resource_name: "user",
              operation: "READ",
              description: "Manage users"
            },
            {
              id: "perm-002",
              service: "identity",
              resource_name: "company",
              operation: "READ",
              description: "Manage companies"
            },
            {
              id: "perm-003",
              service: "guardian",
              resource_name: "role",
              operation: "READ",
              description: "Manage roles"
            }
          ]
        };
        const mockRes = {
            status: 200,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
        expect(json.permissions).toHaveLength(3);
    });

    it("handles user not found", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockRes = {
            status: 404,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue({ message: "User not found" }),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        expect(response.status).toBe(404);
    });

    it("handles unauthorized access", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockRes = {
            status: 403,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue({ message: "Access denied" }),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        expect(response.status).toBe(403);
    });
  });
});
