/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

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
import logger from "@/lib/utils/logger";
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
  // 204 No Content cannot have a body
  if (mock.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  
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
  logger.debug(`Request headers received from client: ${JSON.stringify(serializeHeaders(req.headers))}`);
  logger.debug(`Forwarding ${req.url} to ${fullUrl}`);

  // Read request body - preserve FormData for multipart requests
  const requestContentType = req.headers.get('content-type') || '';
  let body: ArrayBuffer | string | null = null;
  
  if (requestContentType.includes('multipart/form-data')) {
    // For multipart/form-data, read the full body as ArrayBuffer
    // Streaming can cause issues with some Python backends (query params not parsed)
    body = await req.arrayBuffer();
    logger.debug(`Multipart body read: ${body.byteLength} bytes`);
  } else if (req.body) {
    // For other content types, read as text
    body = await req.text();
  }

  // Prepare headers (exclude 'host' header)
  // Also update Content-Length for multipart if we read the body
  const headers = Object.fromEntries(
    Array.from(req.headers.entries()).filter(
      ([key]) => key.toLowerCase() !== "host"
    )
  );
  
  // Update Content-Length if we have an ArrayBuffer body
  if (body instanceof ArrayBuffer) {
    headers['content-length'] = String(body.byteLength);
  }
  
  logger.debug(`Headers being sent to backend: ${JSON.stringify(headers)}`);

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
  const contentType = upstream.headers.get("content-type");
  
  // Prepare headers to forward (skip hop-by-hop headers and Content-Length)
  const headersToForward = new Headers();
  const hopByHopHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer'];
  const skipHeaders = [...hopByHopHeaders, 'content-length']; // Content-Length will be recalculated by Next.js
  
  // Forward headers from upstream response
  if (upstream.headers && typeof upstream.headers.entries === 'function') {
    // Real HTTP responses - iterate all headers
    for (const [key, value] of upstream.headers.entries()) {
      const lowerKey = key.toLowerCase();
      // Skip hop-by-hop headers, content-length, and set-cookie (handled separately)
      if (!skipHeaders.includes(lowerKey) && lowerKey !== 'set-cookie') {
        headersToForward.set(key, value);
      }
    }
    
    // Handle Set-Cookie separately - there can be multiple Set-Cookie headers
    // Using getSetCookie() to get all Set-Cookie headers as an array
    if (typeof upstream.headers.getSetCookie === 'function') {
      const setCookies = upstream.headers.getSetCookie();
      setCookies.forEach(cookie => {
        headersToForward.append('set-cookie', cookie);
      });
    } else {
      // Fallback for environments without getSetCookie
      const setCookie = upstream.headers.get('set-cookie');
      if (setCookie) {
        headersToForward.append('set-cookie', setCookie);
      }
    }
  } else {
    // Fallback for mock objects with only .get() - manually copy important headers
    const contentTypeValue = upstream.headers.get("content-type");
    const setCookieValue = upstream.headers.get("set-cookie");
    const contentDispositionValue = upstream.headers.get("content-disposition");
    const cacheControlValue = upstream.headers.get("cache-control");
    
    if (contentTypeValue) headersToForward.set("content-type", contentTypeValue);
    if (setCookieValue) headersToForward.append("set-cookie", setCookieValue);
    if (contentDispositionValue) headersToForward.set("content-disposition", contentDispositionValue);
    if (cacheControlValue) headersToForward.set("cache-control", cacheControlValue);
  }
  
  let nextRes: NextResponse;
  
  // Handle 204 No Content - must not have a body
  if (upstream.status === 204) {
    logger.debug("204 No Content response");
    nextRes = new NextResponse(null, { 
      status: 204,
      headers: headersToForward
    });
  } else if (contentType && contentType.includes("application/json")) {
    const data = await upstream.json();
    
    // Log selon le status HTTP - erreurs en rouge !
    if (upstream.status >= 400 && upstream.status < 600) {
      logger.error({
        status: upstream.status,
        endpoint: fullUrl,
        method,
        response: data
      }, `HTTP ${upstream.status} Error Response`);
    } else {
      logger.debug(`Response data: ${JSON.stringify(data)}`);
    }
    
    nextRes = NextResponse.json(data, { 
      status: upstream.status,
      headers: headersToForward
    });
  } else if (contentType && (contentType.startsWith("image/") || contentType.includes("octet-stream"))) {
    // Handle binary content (images, files, etc.) - don't log binary data
    const buffer = await upstream.arrayBuffer();
    
    if (upstream.status >= 400 && upstream.status < 600) {
      logger.error({
        status: upstream.status,
        endpoint: fullUrl,
        method,
        contentType,
        size: buffer.byteLength
      }, `HTTP ${upstream.status} Error Response (binary)`);
    } else {
      logger.debug(`Binary response: ${contentType}, size: ${buffer.byteLength} bytes`);
    }
    
    nextRes = new NextResponse(buffer, { 
      status: upstream.status,
      headers: headersToForward
    });
  } else {
    const text = await upstream.text();
    
    // Log selon le status HTTP - erreurs en rouge !
    if (upstream.status >= 400 && upstream.status < 600) {
      logger.error({
        status: upstream.status,
        endpoint: fullUrl,
        method,
        response: text
      }, `HTTP ${upstream.status} Error Response`);
    } else {
      logger.debug(`Response text: ${text}`);
    }
    
    nextRes = new NextResponse(text, { 
      status: upstream.status,
      headers: headersToForward
    });
  }

  return nextRes;
}
