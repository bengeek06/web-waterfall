/**
 * @jest-environment node
 */
/**
 * Test suite for the `GET` handler in `/api/auth/verify`.
 *
 * This suite verifies:
 * - Proxies the verify request to the authentication service
 * - Returns JSON response with token validity
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

describe("GET /api/auth/verify", () => {
  const AUTH_SERVICE_URL = "http://auth_service:5001";
  let req: NextRequest;
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (cookies = "access_token=valid-token; refresh_token=valid-refresh") => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/auth/verify",
      headers: {
        entries: jest.fn().mockReturnValue([
          ["cookie", cookies],
        ]),
        append: jest.fn(),
        delete: jest.fn(),
        get: jest.fn((key: string) => key === "cookie" ? cookies : null),
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

    it("retourne la réponse mock et n'appelle pas fetch", async () => {
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(json).toMatchObject({
        valid: true,
        user_id: expect.any(String),
        email: expect.any(String),
        company_id: expect.any(String),
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

    it("proxies request with cookies and returns valid response", async () => {
        const cookies = "access_token=valid-token; refresh_token=valid-refresh";
        // @ts-expect-error: mock request
        req = buildReq(cookies);
        
        const mockJson = { 
          valid: true,
          user_id: "user-123",
          email: "user@test.com",
          company_id: "company-456"
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
            `${AUTH_SERVICE_URL}/verify`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
                headers: {
                    "cookie": cookies,
                },
            })
        );
        expect(response.constructor.name).toBe("NextResponse");
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("returns 401 when token is invalid", async () => {
        // @ts-expect-error: mock request
        req = buildReq("access_token=invalid-token");
        
        const mockJson = { message: "Invalid or expired access token" };
        const mockRes = {
            status: 401,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json).toMatchObject({ message: expect.stringContaining("Invalid") });
    });

    it("returns 401 when token is missing", async () => {
        // @ts-expect-error: mock request
        req = buildReq("");
        
        const mockJson = { message: "Missing access token" };
        const mockRes = {
            status: 401,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await GETFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json).toMatchObject({ message: expect.stringContaining("Missing") });
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
