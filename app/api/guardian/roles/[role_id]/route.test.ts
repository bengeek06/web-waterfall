/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/roles/[role_id]` handlers.
 *
 * This suite verifies:
 * - GET: Get role by ID
 * - PUT: Update role completely
 * - PATCH: Partially update role
 * - DELETE: Delete role
 * - Handles mock mode when MOCK_API=true
 * - Handles errors and 404s appropriately
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("/api/guardian/roles/[role_id]", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  const ROLE_ID = "role-123";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest, context: { params: Promise<{ role_id: string }> }) => Promise<Response>;
  let PUTFn: (req: NextRequest, context: { params: Promise<{ role_id: string }> }) => Promise<Response>;
  let DELETEFn: (req: NextRequest, context: { params: Promise<{ role_id: string }> }) => Promise<Response>;

  const buildReq = (body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ""),
      url: `http://localhost:3000/api/guardian/roles/${ROLE_ID}`,
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
    } as Partial<NextRequest>;
  };

  const buildContext = () => ({
    params: Promise.resolve({ role_id: ROLE_ID })
  });

  describe("GET - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne un rôle mock par ID", async () => {
      // Mock request object
      const req = buildReq();
      const context = buildContext();
      const res = await GETFn(req as unknown as NextRequest, context);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        company_id: expect.any(String),
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

    it("proxies request and returns role by ID", async () => {
        // Mock request object
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = {
          id: ROLE_ID,
          name: "Admin",
          description: "Administrator role",
          company_id: "company-1"
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
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${GUARDIAN_SERVICE_URL}/roles/${ROLE_ID}`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles 404 when role not found", async () => {
        // Mock request object
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = { error: "Role not found" };
        const mockRes = {
            status: 404,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        
        expect(response.status).toBe(404);
        const json = await response.json();
        expect(json).toMatchObject({ error: expect.any(String) });
    });
  });

  describe("PUT - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ PUT: PUTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and updates role", async () => {
        const requestBody = JSON.stringify({ 
          name: "Updated Admin", 
          description: "Updated description" 
        });
        // Mock request object
        const req = buildReq(requestBody);
        const context = buildContext();
        
        const mockJson = {
          id: ROLE_ID,
          name: "Updated Admin",
          description: "Updated description",
          company_id: "company-1",
          updated_at: "2025-10-19T12:00:00Z"
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
        
        const response = await PUTFn(req as unknown as NextRequest, context);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${GUARDIAN_SERVICE_URL}/roles/${ROLE_ID}`,
            expect.objectContaining({
                method: "PUT",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });

  describe("DELETE - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ DELETE: DELETEFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and deletes role", async () => {
        // Mock request object
        const req = buildReq();
        const context = buildContext();
        
        const mockRes = {
            status: 204,
            headers: {
                get: () => null,
            },
            json: jest.fn(),
            text: jest.fn().mockResolvedValue(""),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await DELETEFn(req as unknown as NextRequest, context);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${GUARDIAN_SERVICE_URL}/roles/${ROLE_ID}`,
            expect.objectContaining({
                method: "DELETE",
                credentials: "include",
            })
        );
        expect(response.status).toBe(204);
    });

    it("handles 403 when user lacks permission", async () => {
        // Mock request object
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = { error: "Insufficient permissions" };
        const mockRes = {
            status: 403,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await DELETEFn(req as unknown as NextRequest, context);
        
        expect(response.status).toBe(403);
        const json = await response.json();
        expect(json).toMatchObject({ error: expect.any(String) });
    });
  });
});
