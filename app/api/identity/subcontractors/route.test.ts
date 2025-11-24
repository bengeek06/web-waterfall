/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/identity/subcontractors` handlers (GET and POST).
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/identity/subcontractors", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/identity/subcontractors",
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
      process.env.IDENTITY_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("returns mock subcontractors list", async () => {
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
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

    it("proxies request and returns subcontractors", async () => {
        const req = buildReq();
        
        const mockJson = [{ id: "company-001", name: "Test Subcontractor" }];
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
            `${IDENTITY_SERVICE_URL}/subcontractors`,
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

describe("POST /api/identity/subcontractors", () => {
  const IDENTITY_SERVICE_URL = "http://identity_service:5002";
  let mockFetch: jest.Mock;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (): Partial<NextRequest> => {
    return {
      text: jest.fn().mockResolvedValue(JSON.stringify({ name: "New Subcontractor" })),
      json: jest.fn().mockResolvedValue({ name: "New Subcontractor" }),
      url: "http://localhost:3000/api/identity/subcontractors",
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

    it("returns mock created company", async () => {
      const req = buildReq();
      const res = await POSTFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      
      const json = await res.json();
      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("name");
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

    it("proxies POST request and creates company", async () => {
        const req = buildReq();
        
        const mockJson = { id: "company-new", name: "New Subcontractor" };
        const mockRes = {
            status: 201,
            headers: {
                get: (key: string) => (key === "content-type" ? "application/json" : null),
            },
            json: jest.fn().mockResolvedValue(mockJson),
            text: jest.fn(),
        };
        mockFetch.mockResolvedValue(mockRes);
        
        const response = await POSTFn(req as unknown as NextRequest);
        
        expect(global.fetch).toHaveBeenCalledWith(
            `${IDENTITY_SERVICE_URL}/subcontractors`,
            expect.objectContaining({
                method: "POST",
            })
        );
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });
});
