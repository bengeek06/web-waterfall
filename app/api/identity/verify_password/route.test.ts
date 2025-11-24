/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/verify_password` handler.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("POST /api/identity/verify_password", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (email?: string, password?: string): Partial<NextRequest> => {
    const body = JSON.stringify({ email: email || "test@example.com", password: password || "test123" });
    return {
      text: jest.fn().mockResolvedValue(body),
      json: jest.fn().mockResolvedValue(JSON.parse(body)),
      url: "http://localhost:3000/api/identity/verify_password",
      headers: {
        entries: jest.fn().mockReturnValue([["content-type", "application/json"]]),
        append: jest.fn(),
        delete: jest.fn(),
        get: jest.fn().mockReturnValue("application/json"),
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
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock verification result", async () => {
      const req = buildReq();
      const res = await POSTFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toHaveProperty("valid");
      expect(typeof json.valid).toBe("boolean");
    });
  });

  describe("MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies POST and verifies password", async () => {
        const req = buildReq("user@test.com", "secure123");
        
        const mockJson = { valid: true, user_id: "usr-001" };
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
        
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/verify_password"),
            expect.objectContaining({
                method: "POST",
            })
        );
    });

    it("handles invalid password", async () => {
        const req = buildReq("user@test.com", "wrong");
        
        const mockJson = { valid: false };
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
        
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.valid).toBe(false);
    });
  });
});
