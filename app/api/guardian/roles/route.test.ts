/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/roles` handlers.
 *
 * This suite verifies:
 * - GET: Lists all roles for a company
 * - POST: Creates a new role
 * - Handles mock mode when MOCK_API=true
 * - Handles errors appropriately
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("/api/guardian/roles", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ""),
      url: "http://localhost:3000/api/guardian/roles",
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

  describe("GET /api/guardian/roles - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la liste des rôles mock", async () => {
      // Mock request object
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        company_id: expect.any(String),
      });
    });
  });

  describe("GET /api/guardian/roles - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns roles list", async () => {
        // Mock request object
        const req = buildReq();
        
        const mockJson = [
          { id: "role-1", name: "Admin", company_id: "company-1" },
          { id: "role-2", name: "User", company_id: "company-1" }
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
            `${GUARDIAN_SERVICE_URL}/roles`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles empty roles list", async () => {
        // Mock request object
        const req = buildReq();
        
        const mockRes = {
            status: 200,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue([]),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBe(0);
    });
  });

  describe("POST /api/guardian/roles - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne un nouveau rôle mock", async () => {
      const body = JSON.stringify({ name: "New Role", description: "Test role" });
      // Mock request object
      const req = buildReq(body);
      const res = await POSTFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(201);
      
      const json = await res.json();
      expect(json).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        company_id: expect.any(String),
      });
    });
  });

  describe("POST /api/guardian/roles - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and creates a new role", async () => {
        const requestBody = JSON.stringify({ 
          name: "Project Manager", 
          description: "Manages projects" 
        });
        // Mock request object
        const req = buildReq(requestBody);
        
        const mockJson = {
          id: "role-new",
          name: "Project Manager",
          description: "Manages projects",
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
            `${GUARDIAN_SERVICE_URL}/roles`,
            expect.objectContaining({
                method: "POST",
                credentials: "include",
            })
        );
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles validation errors", async () => {
        const requestBody = JSON.stringify({ name: "" }); // Invalid: empty name
        // Mock request object
        const req = buildReq(requestBody);
        
        const mockJson = { error: "Name is required" };
        const mockRes = {
            status: 400,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json).toMatchObject({ error: expect.any(String) });
    });
  });
});
