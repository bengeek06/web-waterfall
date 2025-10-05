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
    error: jest.fn(), // added to prevent TypeError when route calls logger.error
}));

describe("POST /api/auth/login", () => {
    const AUTH_SERVICE_URL = "http://auth_service:5001";
    let req: NextRequest;
    let mockFetch: jest.Mock;
    let POSTFn: (req: NextRequest) => Promise<Response>; // dynamic handler reference

    beforeEach(async () => {
        jest.resetModules();
        process.env.AUTH_SERVICE_URL = AUTH_SERVICE_URL;
        process.env.MOCK_API = "false"; // ensure proxy path
        // dynamic import AFTER env vars are set so constant is populated
        ({ POST: POSTFn } = await import("./route"));

        // @ts-expect-error mock request
        req = {
            text: jest.fn(),
            headers: {
                entries: jest.fn(),
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
        mockFetch = jest.fn();
        global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("proxies request and returns JSON response", async () => {
        const requestBody = '{"username":"user","password":"pass"}';
        (req.text as jest.Mock).mockResolvedValue(requestBody);
        (req.headers.entries as jest.Mock).mockReturnValue([
            ["content-type", "application/json"],
            ["x-custom", "value"],
            ["host", "should-be-filtered"],
        ]);
        const mockJson = { token: "abc123" };
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
                    "x-custom": "value",
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
        (req.text as jest.Mock).mockResolvedValue(requestBody);
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
        expect(response.headers.get("content-type")).toContain("text/plain");
        const text = await response.text();
        expect(text).toBe(mockText);
    });

    it("sets set-cookie header if present", async () => {
        const requestBody = '{"username":"user"}';
        (req.text as jest.Mock).mockResolvedValue(requestBody);
        (req.headers.entries as jest.Mock).mockReturnValue([["content-type", "application/json"]]);
        const mockJson = { ok: true };
        const cookieValue = "sessionid=abc; Path=/; HttpOnly";
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
});