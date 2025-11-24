/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/permissions` handler.
 *
 * This suite verifies:
 * - GET: Lists all permissions (read-only)
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

describe("GET /api/guardian/permissions", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/guardian/permissions",
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

  describe("MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la liste des permissions mock", async () => {
      // Mock request object
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toMatchObject({
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

    it("proxies request and returns permissions list", async () => {
        // Mock request object
        const req = buildReq();
        
        const mockJson = [
          { 
            id: "perm-1", 
            service: "identity",
            resource_name: "user",
            operation: "READ"
          },
          { 
            id: "perm-2", 
            service: "identity",
            resource_name: "user",
            operation: "UPDATE"
          }
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
            `${GUARDIAN_SERVICE_URL}/permissions`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles empty permissions list", async () => {
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
});
