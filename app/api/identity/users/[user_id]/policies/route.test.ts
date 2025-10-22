/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/users/[user_id]/policies` handlers.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/identity/users/[user_id]/policies", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  const USER_ID = "usr-001";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: `http://localhost:3000/api/identity/users/${USER_ID}/policies`,
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

    it("returns mock policies list aggregated from Guardian", async () => {
      const req = buildReq();
      const context = buildContext();
      const res = await GETFn(req as unknown as NextRequest, context);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toHaveProperty("policies");
      expect(Array.isArray(json.policies)).toBe(true);
      expect(json.policies.length).toBeGreaterThan(0);
      expect(json.policies[0]).toHaveProperty("id");
      expect(json.policies[0]).toHaveProperty("name");
      expect(json.policies[0]).toHaveProperty("company_id");
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

    it("proxies request and returns user policies from Guardian", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = {
          policies: [
            {
              id: "policy-001",
              name: "Project Management Policy",
              description: "Permissions for project management",
              company_id: "company-001"
            },
            {
              id: "policy-002",
              name: "User Management Policy",
              description: "Permissions for user management",
              company_id: "company-001"
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
        expect(json.policies).toHaveLength(2);
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
  });
});
