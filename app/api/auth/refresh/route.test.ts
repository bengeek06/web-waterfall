/**
 * @jest-environment node
 */
/**
 * Test suite for the `POST` handler in `/api/auth/refresh`.
 *
 * This suite verifies:
 * - Proxies the refresh request to the authentication service
 * - Returns new tokens in response
 * - Sets new cookies properly
 * - Handles mock mode when MOCK_API=true
 * - Handles errors (missing refresh token, invalid token, etc.)
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("POST /api/auth/refresh", () => {
  const AUTH_SERVICE_URL = "http://auth_service:5001";
  let req: NextRequest;
  let mockFetch: jest.Mock;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (cookies = "refresh_token=valid-refresh-token") => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/auth/refresh",
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
      ({ POST: POSTFn } = await import("./route"));
      // @ts-expect-error: mock request
      req = buildReq();
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la réponse mock avec nouveaux tokens", async () => {
      const res = await POSTFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(json).toMatchObject({
        message: "Token refreshed",
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
      
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("access_token=");
      expect(setCookie).toContain("refresh_token=");
    });
  });

  describe("MOCK_API=false (proxy vers service)", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.AUTH_SERVICE_URL = AUTH_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request with refresh token and returns new tokens", async () => {
        const cookies = "refresh_token=valid-refresh-token";
        // @ts-expect-error: mock request
        req = buildReq(cookies);
        
        const mockJson = { 
          message: "Token refreshed",
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          _dev_note: "Tokens visible in development mode only"
        };
        const cookieValue = "access_token=new-token; Path=/; HttpOnly";
        const mockRes = {
            status: 200,
            headers: {
                get: (key: string) => {
                    if (key === "content-type") return "application/json";
                    if (key === "set-cookie") return cookieValue;
                    return null;
                },
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${AUTH_SERVICE_URL}/refresh`,
            expect.objectContaining({
                method: "POST",
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
        expect(response.headers.get("set-cookie")).toBe(cookieValue);
    });

    it("returns 400 when refresh token is missing", async () => {
        // @ts-expect-error: mock request
        req = buildReq("");
        
        const mockJson = { message: "Missing refresh token" };
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
        expect(json).toMatchObject({ message: expect.stringContaining("Missing") });
    });

    it("returns 401 when refresh token is invalid or expired", async () => {
        // @ts-expect-error: mock request
        req = buildReq("refresh_token=invalid-token");
        
        const mockJson = { message: "Invalid or expired refresh token" };
        const mockRes = {
            status: 401,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json).toMatchObject({ message: expect.stringContaining("Invalid") });
    });

    it("handles connection refused error", async () => {
        // @ts-expect-error: mock request
        req = buildReq();
        
        const error = new Error("connect ECONNREFUSED") as Error & { code: string };
        error.code = "ECONNREFUSED";
        mockFetch.mockRejectedValue(error);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
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
        ({ POST: POSTFn } = await import("./route"));
        
        // @ts-expect-error: mock request
        req = buildReq();
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "AUTH_SERVICE_URL is not defined"
        });
    });
  });
});
