/**
 * Simple client-side fetch utility
 * 
 * This replaces the old clientSessionFetch with a simpler approach.
 * The token refresh is now handled by the browser automatically via cookies
 * and the /api/auth/refresh endpoint when needed.
 */

/**
 * Client-side fetch with automatic Content-Type handling
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response>
 */
export async function clientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Auto-add Content-Type for JSON payloads
  const processedInit = addJsonContentTypeIfNeeded(init);
  
  // Make the request with credentials to include cookies
  return fetch(input, {
    ...processedInit,
    credentials: 'include'
  });
}

/**
 * Helper to automatically add Content-Type: application/json for requests with JSON body
 */
function addJsonContentTypeIfNeeded(init?: RequestInit): RequestInit {
  if (!init || !init.body) return init || {};
  
  const method = init.method?.toUpperCase();
  if (!method || !['POST', 'PUT', 'PATCH'].includes(method)) return init;

  // Get existing headers
  let headers: Record<string, string> = {};
  if (init.headers instanceof Headers) {
    init.headers.forEach((value, key) => { headers[key] = value; });
  } else if (Array.isArray(init.headers)) {
    init.headers.forEach(([key, value]) => { headers[key] = value; });
  } else if (init.headers) {
    headers = { ...(init.headers as Record<string, string>) };
  }

  // Check if Content-Type is already set
  const hasContentType = Object.keys(headers).some(
    key => key.toLowerCase() === 'content-type'
  );
  
  // Add Content-Type if not present and body looks like JSON
  if (!hasContentType) {
    try {
      if (typeof init.body === 'string') {
        JSON.parse(init.body);
        headers['Content-Type'] = 'application/json';
      }
    } catch {
      // Not JSON, don't add Content-Type
    }
  }

  return { ...init, headers };
}

// For backward compatibility, export as clientSessionFetch
export { clientFetch as clientSessionFetch };