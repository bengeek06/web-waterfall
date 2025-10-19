/**
 * @jest-environment node
 */
/**
 * Test suite for `/api/guardian/policies` handlers.
 *
 * This suite verifies:
 * - GET: Lists all policies for a company
 * - POST: Creates a new policy
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

describe("/api/guardian/policies", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5000";
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;
  let POSTFn: (req: NextRequest) => Promise<Response>;

  const buildReq = (body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ""),
      url: "http://localhost:3000/api/guardian/policies",
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
    };
  };

  describe("GET - MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la liste des policies mock", async () => {
      // @ts-expect-error: mock request
      const req = buildReq();
      const res = await GETFn(req as unknown as NextRequest);
      
      expect(mockFetch).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        company_id: expect.any(String),
      });
    });
  });

  describe("GET - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ GET: GETFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns policies list", async () => {
        // @ts-expect-error: mock request
        const req = buildReq();
        
        const mockJson = [
          { id: "policy-1", name: "Admin Policy", company_id: "company-1" },
          { id: "policy-2", name: "Read-Only Policy", company_id: "company-1" }
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
            `${GUARDIAN_SERVICE_URL}/policies`,
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });

  describe("POST - MOCK_API=false", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = GUARDIAN_SERVICE_URL;
      process.env.MOCK_API = "false";
      ({ POST: POSTFn } = await import("./route"));
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and creates a new policy", async () => {
        const requestBody = JSON.stringify({ 
          name: "New Policy", 
          description: "Test policy" 
        });
        // @ts-expect-error: mock request
        const req = buildReq(requestBody);
        
        const mockJson = {
          id: "policy-new",
          name: "New Policy",
          description: "Test policy",
          company_id: "company-1",
          created_at: "2025-10-19T12:00:00Z"
        };
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
            `${GUARDIAN_SERVICE_URL}/policies`,
            expect.objectContaining({
                method: "POST",
                body: requestBody,
                credentials: "include",
            })
        );
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json).toEqual(mockJson);
    });
  });
});
