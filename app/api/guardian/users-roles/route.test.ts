/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/users-roles` handlers.
 *
 * This suite verifies:
 * - GET: Lists all user-role associations
 * - POST: Creates a new user-role association
 * - Handles mock mode when MOCK_API=true
 * - Handles errors appropriately
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("/api/guardian/users-roles", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ""),
      url: "http://localhost:3000/api/guardian/users-roles",
      headers: {
        entries: jest.fn().mockReturnValue(
          body ? [["content-type", "application/json"]] : []
        ),
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
    };
  };

  describe("GET - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la liste des user-roles mock", async () => {
      // @ts-expect-error: mock request
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toMatchObject({
        id: expect.any(String),
        user_id: expect.any(String),
        role_id: expect.any(String),
      });
    });
  });

  describe("GET - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns user-roles list", async () => {
        // @ts-expect-error: mock request
        const req = buildReq();
        
        const mockJson = [
          { id: "ur-1", user_id: "user-1", role_id: "role-1", company_id: "company-1" },
          { id: "ur-2", user_id: "user-2", role_id: "role-2", company_id: "company-1" }
        ];
        const mockRes = {
            status: 200,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${GUARDIAN_SERVICE_URL}/user-roles`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });

  describe("POST - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and creates a new user-role association", async () => {
        const requestBody = JSON.stringify({ 
          user_id: "user-123", 
          role_id: "role-456"
        });
        // @ts-expect-error: mock request
        const req = buildReq(requestBody);
        
        const mockJson = {
          id: "ur-new",
          user_id: "user-123",
          role_id: "role-456",
          company_id: "company-1",
          created_at: "2025-10-19T12:00:00Z"
        };
        const mockRes = {
            status: 201,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${GUARDIAN_SERVICE_URL}/user-roles`,
            expect.objectContaining({
                method: "POST",
                body: requestBody,
                credentials: "include",
            })
        );
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles duplicate user-role error", async () => {
        const requestBody = JSON.stringify({ 
          user_id: "user-123", 
          role_id: "role-456"
        });
        // @ts-expect-error: mock request
        const req = buildReq(requestBody);
        
        const mockJson = { error: "User-role association already exists" };
        const mockRes = {
            status: 409,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(409);
        const json = await response.json();
        expect(json).toMatchObject({ error: expect.any(String) });
    });
  });
});
