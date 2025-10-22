/**
 * @jest-environment node
 */
/**
 * Test suite for the `POST` handler in `/api/auth/login`.
 *
 * This suite verifies the following behaviors:
 * - Proxies the login request to the authentication service and returns a JSON response.
 * - Proxies the login request and returns a plain text response when appropriate.
 * - Correctly sets the `set-cookie` header on the response if present in the proxied response.
 *
 * Mocks:
 * - Mocks the logger module to prevent actual logging during tests.
 * - Mocks the `fetch` global to intercept and inspect outgoing requests.
 * - Mocks the `NextRequest` object to simulate incoming requests.
 *
 * Each test:
 * - Prepares a mock request and response.
 * - Asserts that the proxied request is constructed correctly.
 * - Asserts that the response from the handler matches the expected output, including headers and body.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("POST /api/auth/login", () => {
  const AUTH_SERVICE_URL = "http://auth_service:5001";
  let req: NextRequest;
  let mockFetch: jest.Mock;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (body = '{"email":"test@example.com","password":"pass123"}') => {
    return {
      text: jest.fn().mockResolvedValue(body),
      url: "http://localhost:3000/api/auth/login",
      headers: {
        entries: jest.fn().mockReturnValue([
          ["content-type", "application/json"],
        ]),
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
      ({ POST: POSTFn } = await import("./route"));
      // @ts-expect-error: mock request
      req = buildReq();
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la réponse mock et n'appelle pas fetch", async () => {
      const res = await POSTFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.constructor.name).toBe("NextResponse");
      
      const json = await res.json();
      expect(json).toMatchObject({
        message: "Login successful",
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

    it("proxies request and returns JSON response", async () => {
        const requestBody = '{"email":"user@test.com","password":"pass"}';
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        
        const mockJson = { 
          message: "Login successful",
          access_token: "token123",
          refresh_token: "refresh123"
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
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${AUTH_SERVICE_URL}/login`,
            expect.objectContaining({
                method: "POST",
                body: requestBody,
                credentials: "include",
                headers: {
                    "content-type": "application/json",
                },
            })
        );
        expect(response.constructor.name).toBe("NextResponse");
        expect(response.headers.get("content-type")).toContain("application/json");
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });

    it("proxies request and returns text response", async () => {
        const requestBody = "plain text body";
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        (req.headers.entries as jest.Mock).mockReturnValue([["content-type", "text/plain"]]);
        
        const mockText = "plain response";
        const mockRes = {
            status: 401,
            headers: {
                get: (key: string) => (key === "content-type" ? "text/plain" : null),
            },
            json: jest.fn(),
            text: jest.fn().mockResolvedValue(mockText),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${AUTH_SERVICE_URL}/login`,
            expect.objectContaining({
                method: "POST",
                body: requestBody,
                credentials: "include",
                headers: { "content-type": "text/plain" },
            })
        );
        expect(response.constructor.name).toBe("NextResponse");
        expect(response.status).toBe(401);
        const text = await response.text();
        expect(text).toBe(mockText);
    });

    it("sets set-cookie header if present", async () => {
        const requestBody = '{"email":"user@test.com","password":"pass"}';
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        
        const mockJson = { message: "Login successful" };
        const cookieValue = "access_token=abc123; Path=/; HttpOnly";
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
        
        expect(response.headers.get("set-cookie")).toBe(cookieValue);
    });

    it("handles connection refused error", async () => {
        const requestBody = '{"email":"user@test.com","password":"pass"}';
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        
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

    it("handles generic fetch error", async () => {
        const requestBody = '{"email":"user@test.com","password":"pass"}';
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        
        mockFetch.mockRejectedValue(new Error("Network error"));
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(502);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "Upstream fetch failed",
            details: "See server logs"
        });
    });

    it("returns error if AUTH_SERVICE_URL is not defined", async () => {
        jest.resetModules();
        delete process.env.AUTH_SERVICE_URL;
        process.env.MOCK_API = "false";
        ({ POST: POSTFn } = await import("./route"));
        
        const requestBody = '{"email":"user@test.com","password":"pass"}';
        // @ts-expect-error: mock request
        req = buildReq(requestBody);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json).toMatchObject({
            error: "AUTH_SERVICE_URL is not defined"
        });
    });
  });
});