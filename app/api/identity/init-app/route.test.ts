/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/init-app` handlers (GET and POST).
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/identity/init-app", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    const headersEntries = [["content-type", "application/json"]];
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/identity/init-app",
      headers: {
        entries: jest.fn().mockReturnValue(headersEntries),
        append: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        getSetCookie: jest.fn(),
        has: jest.fn(),
        set: jest.fn(),
        forEach: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        [Symbol.iterator]: jest.fn().mockReturnValue(headersEntries[Symbol.iterator]()),
      },
    } as Partial<NextRequest>;
  };

  describe("MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock app initialization status", async () => {
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      
      const json = await res.json();
      expect(json).toHaveProperty("initialized");
    });
  });

  describe("MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.IDENTITY_SERVICE_URL = IDENTITY_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns init status", async () => {
        const req = buildReq();
        
        const mockJson = { initialized: true, message: "Database is initialized" };
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
            `${IDENTITY_SERVICE_URL}/init-db`,
            expect.objectContaining({
                method: "GET",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });
});

describe("POST /api/identity/init-app", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue("{}"),
      json: jest.fn().mockResolvedValue({}),
      url: "http://localhost:3000/api/identity/init-app",
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

    it("returns mock initialization success", async () => {
      const req = buildReq();
      const res = await POSTFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      
      const json = await res.json();
      expect(json).toHaveProperty("user");
      expect(json).toHaveProperty("company");
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

    it("proxies POST request and initializes database", async () => {
        const req = buildReq();
        
        const mockJson = { initialized: true, message: "Database initialized successfully" };
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
            `${IDENTITY_SERVICE_URL}/init-db`,
            expect.objectContaining({
                method: "POST",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });
});
