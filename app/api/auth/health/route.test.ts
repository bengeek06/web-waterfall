/**
 * @jest-environment node
 */
/**
 * Test suite for the `GET` handler in `/api/auth/health`.
 *
 * This suite verifies:
 * - Proxies the health check request to the authentication service
 * - Returns service health status
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

describe("GET /api/auth/health", () => {
  const AUTH_SERVICE_URL = "http://auth_service:5001";
  let req: NextRequest;
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = () => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/auth/health",
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
    };
  };

  describe("MOCK_API=true (mode sans backend)", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.AUTH_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      // @ts-expect-error: mock request
      req = buildReq();
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la réponse mock du health check", async () => {
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(json).toMatchObject({
        status: expect.any(String),
        service: expect.any(String),
        message: expect.any(String),
      });
    });
  });

  describe("MOCK_API=false (proxy vers service)", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.AUTH_SERVICE_URL = AUTH_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns healthy status", async () => {
        // @ts-expect-error: mock request
        req = buildReq();
        
        const mockJson = { 
          status: "healthy",
          service: "authentication",
          message: "Authentication service is running"
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
            `${AUTH_SERVICE_URL}/health`,
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

    it("returns degraded status when service has issues", async () => {
        // @ts-expect-error: mock request
        req = buildReq();
        
        const mockJson = { 
          status: "degraded",
          service: "authentication",
          message: "Database connection slow"
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
        
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toMatchObject({ 
          status: "degraded",
          message: expect.any(String)
        });
    });

    it("handles connection refused error", async () => {
        // @ts-expect-error: mock request
        req = buildReq();
        
        const error = new Error("connect ECONNREFUSED") as Error & { code: string };
        error.code = "ECONNREFUSED";
        mockFetch.mockRejectedValue(error);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(503);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "AUTH_SERVICE unavailable",
            details: "Connection refused"
        });
    });

    it("returns error if AUTH_SERVICE_URL is not defined", async () => {
        jest.resetModules();
        delete process.env.AUTH_SERVICE_URL;
        process.env.MOCK_API = "false";
        ({ GET: GETFn } = await import("./route"));
        
        // @ts-expect-error: mock request
        req = buildReq();
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "AUTH_SERVICE_URL is not defined"
        });
    });
  });
});
