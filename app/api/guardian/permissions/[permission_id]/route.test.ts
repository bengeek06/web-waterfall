/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/permissions/[permission_id]` handler.
 *
 * This suite verifies:
 * - GET: Get permission by ID (read-only)
 * - Handles mock mode when MOCK_API=true
 * - Handles errors appropriately (404, 401, 500)
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/guardian/permissions/[permission_id]", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  const PERMISSION_ID = "perm-001";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest, context: { params: Promise<{ permission_id: string }> }) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: `http://localhost:3000/api/guardian/permissions/${PERMISSION_ID}`,
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
    params: Promise.resolve({ permission_id: PERMISSION_ID })
  });

  describe("MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock permission details", async () => {
      const req = buildReq();
      const context = buildContext();
      const res = await GETFn(req as unknown as NextRequest, context);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toMatchObject({
        id: expect.any(String),
        service: expect.any(String),
        resource_name: expect.any(String),
        operation: expect.any(String),
      });
    });
  });

  describe("MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns permission details", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = {
          id: PERMISSION_ID,
          service: "identity",
          resource_name: "user",
          description: "User management permission",
          operation: "READ",
          created_at: "2025-10-01T10:00:00Z",
          updated_at: "2025-10-01T10:00:00Z"
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
            `${GUARDIAN_SERVICE_URL}/permissions/${PERMISSION_ID}`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles permission not found (404)", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockRes = {
            status: 404,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue({ message: "Permission not found" }),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        
        expect(response.status).toBe(404);
        const json = await response.json();
        expect(json).toHaveProperty("message");
    });

    it("handles unauthorized access (401)", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockRes = {
            status: 401,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue({ message: "Unauthorized" }),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest, context);
        
        expect(response.status).toBe(401);
    });
  });
});
