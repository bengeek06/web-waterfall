/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/users/user-001` handlers.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("/api/identity/users/user-001", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  const USER_ID = "user-id-001";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;
  let PUTFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;
  let PATCHFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;
  let DELETEFn: (req: NextRequest, context: { params: Promise<{ user_id: string }> }) => Promise<Response>;

  const buildReq = (body?: string): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(body || ""),
      json: jest.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
      url: `http://localhost:3000/api/identity/users/user-001`,
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
    params: Promise.resolve({ user_id: USER_ID })
  });

  describe("GET - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock User by ID", async () => {
      const req = buildReq();
      const context = buildContext();
      const res = await GETFn(req as unknown as NextRequest, context);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json).toHaveProperty("id");
    });
  });

  describe("GET - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies GET request", async () => {
        const req = buildReq();
        const context = buildContext();
        
        const mockJson = { id: "user-id-001", name: "Test User" };
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
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });

  describe("PUT - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ PUT: PUTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies PUT request", async () => {
        const req = buildReq(JSON.stringify({ name: "Updated" }));
        const context = buildContext();
        
        const mockJson = { id: "user-id-001", name: "Updated" };
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
        expect(response.status).toBe(200);
    });
  });

  describe("PATCH - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ PATCH: PATCHFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies PATCH request", async () => {
        const req = buildReq(JSON.stringify({ name: "Patched" }));
        const context = buildContext();
        
        const mockJson = { id: "user-id-001", name: "Patched" };
        const mockRes = {
            status: 200,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await PATCHFn(req as unknown as NextRequest, context);
        expect(response.status).toBe(200);
    });
  });

  describe("DELETE - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ DELETE: DELETEFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies DELETE request and returns 204", async () => {
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
        expect(response.status).toBe(204);
    });
  });
});
