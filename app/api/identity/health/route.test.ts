/**
 * @jest-environment node
 */
/**
 * Test suite for the `GET` handler in `/api/identity/health`.
 *
 * This suite verifies:
 * - Proxies the health check request to the identity service
 * - Returns service health status with database checks
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

describe("GET /api/identity/health", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/identity/health",
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

  describe("MOCK_API=true (mode sans backend)", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la réponse mock du health check", async () => {
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(json).toMatchObject({
        status: expect.any(String),
        service: "identity_service",
        checks: expect.any(Object),
      });
    });
  });

  describe("MOCK_API=false (proxy vers service)", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns healthy status", async () => {
        const req = buildReq();
        
        const mockJson = { 
          status: "healthy",
          service: "identity_service",
          checks: {
            database: {
              healthy: true,
              message: "Database connection successful"
            }
          }
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
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${IDENTITY_SERVICE_URL}/health`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.constructor.name).toBe("NextResponse");
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("handles connection refused error", async () => {
        const req = buildReq();
        
        const error = new Error("connect ECONNREFUSED") as Error & { code: string };
        error.code = "ECONNREFUSED";
        mockFetch.mockRejectedValue(error);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(503);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "IDENTITY_SERVICE unavailable",
            details: "Connection refused"
        });
    });

    it("returns error if IDENTITY_SERVICE_URL is not defined", async () => {
        jest.resetModules();
        delete process.env.IDENTITY_SERVICE_URL;
        process.env.MOCK_API = "false";
        ({ GET: GETFn } = await import("./route"));
        
        const req = buildReq();
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "IDENTITY_SERVICE_URL is not defined"
        });
    });
  });
});
