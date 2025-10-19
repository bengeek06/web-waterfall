/**
 * Generic proxy request handler
 * 
 * This module provides a centralized way to proxy requests to backend services.
 * It handles:
 * - Mock responses when MOCK_API=true
 * - Request forwarding with headers and cookies
 * - Error handling and logging
 * - Response formatting (JSON/text)
 * - Cookie passthrough
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { ProxyConfig, MockResponse } from './types';

/**
 * Helper to safely serialize headers for logging
 */
function serializeHeaders(h: Headers | unknown): Record<string, string> {
  try {
    if (h instanceof Headers) {
      return Object.fromEntries(Array.from(h.entries()));
    }
    if (h && typeof h === "object" && Symbol.iterator in h) {
      return Object.fromEntries(Array.from(h as Iterable<[string, string]>));
    }
  } catch (e) {
    logger.warn(`Failed to serialize headers: ${e}`);
  }
  return {};
}

/**
 * Create a NextResponse from a mock response
 */
function createMockResponse(mock: MockResponse): NextResponse {
  const response = typeof mock.body === 'string'
    ? new NextResponse(mock.body, { status: mock.status })
    : NextResponse.json(mock.body, { status: mock.status });

  // Set cookies if provided
  if (mock.cookies && mock.cookies.length > 0) {
    mock.cookies.forEach(cookie => {
      response.headers.append("set-cookie", cookie);
    });
  }

  // Set additional headers if provided
  if (mock.headers) {
    Object.entries(mock.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Main proxy request handler
 * 
 * @param req - The incoming Next.js request
 * @param config - Proxy configuration
 * @returns A NextResponse with the proxied or mocked response
 */
export async function proxyRequest(
  req: NextRequest,
  config: ProxyConfig
): Promise<NextResponse> {
  const { service, path, method, mock } = config;
  const endpoint = `${service}${path}`;

  logger.info(`${method} request to /api${path}`);

  // Return mock if MOCK_API is enabled
  if (process.env.MOCK_API === 'true') {
    if (!mock) {
      logger.warn(`MOCK_API is true but no mock provided for ${endpoint}`);
      return NextResponse.json(
        { error: "Mock not configured for this endpoint" },
        { status: 500 }
      );
    }
    logger.warn(`Mocking ${service} response for ${path}`);
    return createMockResponse(mock);
  }

  // Get service URL from environment
  const serviceUrl = process.env[service];
  if (!serviceUrl) {
    logger.error(`${service} is not defined in environment variables`);
    return NextResponse.json(
      { error: `${service} is not defined` },
      { status: 500 }
    );
  }

  const fullUrl = `${serviceUrl}${path}`;
  logger.debug(`Environment ${service}: ${serviceUrl}`);
  logger.debug(`Request headers: ${JSON.stringify(serializeHeaders(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${fullUrl}`);

  // Read request body
  const body = await req.text();

  // Prepare headers (exclude 'host' header)
  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(
      ([key]) => key.toLowerCase() !== "host"
    )
  );

  // Make upstream request
  let upstream: Response;
  try {
    upstream = await fetch(fullUrl, {
      method,
      headers,
      body: body || undefined,
      credentials: "include",
    });
  } catch (err: unknown) {
    // Handle fetch errors
    let errorMessage = "";
    let errorCode: string | undefined = undefined;
    
    if (err && typeof err === "object") {
      if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
        errorMessage = (err as { message: string }).message;
      }
      if ("code" in err && typeof (err as { code?: unknown }).code === "string") {
        errorCode = (err as { code: string }).code;
      }
    }

    logger.error(`Fetch to ${service} failed: ${errorMessage || err}`);
    
    const isConnRefused =
      errorCode === 'ECONNREFUSED' ||
      /ECONNREFUSED/.test(errorMessage || "");

    return NextResponse.json(
      {
        error: isConnRefused ? `${service.replace('_URL', '')} unavailable` : "Upstream fetch failed",
        details: isConnRefused ? "Connection refused" : "See server logs"
      },
      { status: isConnRefused ? 503 : 502 }
    );
  }

  // Process response
  const setCookieHeaders = upstream.headers.get("set-cookie");
  const contentType = upstream.headers.get("content-type");
  
  let nextRes: NextResponse;
  
  if (contentType && contentType.includes("application/json")) {
    const data = await upstream.json();
    logger.debug(`Response data: ${JSON.stringify(data)}`);
    nextRes = NextResponse.json(data, { status: upstream.status });
  } else {
    const text = await upstream.text();
    logger.debug(`Response text: ${text}`);
    nextRes = new NextResponse(text, { status: upstream.status });
  }

  // Forward Set-Cookie headers if present
  if (setCookieHeaders) {
    nextRes.headers.set("set-cookie", setCookieHeaders);
  }

  return nextRes;
}
