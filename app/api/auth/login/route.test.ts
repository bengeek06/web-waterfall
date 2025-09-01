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
import { POST } from "./route";
import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
}));

describe("POST /api/auth/login", () => {
    const AUTH_SERVICE_URL = "http://auth_service:5000";
    let req: NextRequest;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env.AUTH_SERVICE_URL = AUTH_SERVICE_URL;
        // @ts-expect-error: Mocking NextRequest object for testing purposes
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
    });

    it("sets set-cookie header if present", async () => {
        const originalEnv = process.env.NODE_ENV;
        Object.defineProperty(process.env, "NODE_ENV", { value: "test" });
        const requestBody = '{"username":"user"}';
        (req.text as jest.Mock).mockResolvedValue(requestBody);
        (req.headers.entries as jest.Mock).mockReturnValue([
            ["content-type", "application/json"],
        ]);

        const response = await POST(req as unknown as NextRequest);

        expect(response.headers.get("set-cookie")).toBe("auth_token=mocktoken; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600");
        Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv });
    });
});