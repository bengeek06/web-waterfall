# Proxy Cookie Handling - Bidirectional Flow

## Overview

The Next.js proxy correctly handles cookies in **both directions**:
1. **Client → Backend**: Request cookies (authentication)
2. **Backend → Client**: Response cookies (session tokens)

This document verifies and documents the correct implementation.

---

## Request Cookie Forwarding (Client → Backend)

### Implementation

**File**: `lib/proxy/index.ts` (lines 132-136)

```typescript
// Prepare headers (exclude 'host' header)
const headers = Object.fromEntries(
  Array.from(req.headers.entries()).filter(
    ([key]) => key.toLowerCase() !== "host"
  )
);
```

**How it works**:
1. Copies **all** incoming request headers from client
2. Excludes only the `host` header (incorrect for backend service)
3. Includes `cookie` header with `access_token`, `refresh_token`, etc.

### Verification

**Test File**: `lib/proxy/index.test.ts`

```typescript
it('should forward Cookie header from client to backend service', async () => {
  const req = new NextRequest('http://localhost:3000/api/test/endpoint', {
    headers: {
      'cookie': 'access_token=eyJhbGc...; refresh_token=8_ittp...',
    },
  });

  await proxyRequest(req, { ... });

  // Verify cookies were sent to backend
  expect(mockFetch).toHaveBeenCalledWith(
    'http://test_service:5000/endpoint',
    expect.objectContaining({
      headers: expect.objectContaining({
        'cookie': 'access_token=eyJhbGc...; refresh_token=8_ittp...',
      }),
    })
  );
});
```

**Test Results**: ✅ **4/4 tests passing**

### Example Flow

```
Client Request:
GET /api/basic-io/export HTTP/1.1
Host: localhost:3000
Cookie: access_token=eyJ...; refresh_token=8_itt...
Accept: application/json

    ↓ [Next.js Proxy]

Backend Request:
GET /export HTTP/1.1
Host: basic_io_service:5006    ← Changed
Cookie: access_token=eyJ...; refresh_token=8_itt...  ← ✅ Preserved
Accept: application/json
```

---

## Response Cookie Forwarding (Backend → Client)

### Implementation

**File**: `lib/proxy/index.ts` (lines 198-207)

```typescript
// Handle Set-Cookie separately - can have multiple values
if (typeof upstream.headers.getSetCookie === 'function') {
  const setCookies = upstream.headers.getSetCookie();
  setCookies.forEach(cookie => {
    headersToForward.append('set-cookie', cookie);  // ✅ Preserves all
  });
}
```

**How it works**:
1. Uses `getSetCookie()` to get **all** Set-Cookie headers as array
2. Uses `append()` instead of `set()` to preserve multiple values
3. Forwards both `access_token` and `refresh_token` cookies

### Verification

**Test File**: `app/api/auth/login/route.test.ts`

```typescript
it('forwards BOTH access_token and refresh_token cookies', async () => {
  const mockHeaders = new Headers();
  mockHeaders.append('set-cookie', 'access_token=eyJ...; HttpOnly');
  mockHeaders.append('set-cookie', 'refresh_token=8_ittp...; HttpOnly');

  const response = await POST(req);

  const setCookieHeaders = response.headers.getSetCookie();
  expect(setCookieHeaders.length).toBeGreaterThanOrEqual(2);
  expect(setCookieHeaders.some(c => c.includes('access_token='))).toBe(true);
  expect(setCookieHeaders.some(c => c.includes('refresh_token='))).toBe(true);
});
```

**Test Results**: ✅ **8/8 tests passing**

### Example Flow

```
Backend Response:
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: access_token=eyJ...; HttpOnly; Path=/; SameSite=Lax
Set-Cookie: refresh_token=8_itt...; HttpOnly; Path=/; SameSite=Lax

    ↓ [Next.js Proxy]

Client Response:
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: access_token=eyJ...; HttpOnly; Path=/; SameSite=Lax  ← ✅ Preserved
Set-Cookie: refresh_token=8_itt...; HttpOnly; Path=/; SameSite=Lax  ← ✅ Preserved
```

---

## Complete Bidirectional Flow

### Scenario: Login + Protected API Call

#### 1. Login Request

```
Client → Next.js Proxy:
POST /api/auth/login
Content-Type: application/json
{"email": "admin@example.com", "password": "password"}

Next.js Proxy → Auth Service:
POST /login
Content-Type: application/json
{"email": "admin@example.com", "password": "password"}

Auth Service → Next.js Proxy:
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJ...; HttpOnly
Set-Cookie: refresh_token=8_itt...; HttpOnly
{"message": "Login successful"}

Next.js Proxy → Client:
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJ...; HttpOnly  ← ✅ Both cookies forwarded
Set-Cookie: refresh_token=8_itt...; HttpOnly
{"message": "Login successful"}
```

#### 2. Protected API Call

```
Client → Next.js Proxy:
GET /api/basic-io/export?url=...
Cookie: access_token=eyJ...; refresh_token=8_itt...  ← Client sends cookies

Next.js Proxy → Basic I/O Service:
GET /export?url=...
Cookie: access_token=eyJ...; refresh_token=8_itt...  ← ✅ Cookies forwarded

Basic I/O Service → Next.js Proxy:
HTTP/1.1 200 OK
Content-Disposition: attachment; filename="export.json"
[...data...]

Next.js Proxy → Client:
HTTP/1.1 200 OK
Content-Disposition: attachment; filename="export.json"  ← ✅ Headers forwarded
[...data...]
```

---

## Common Issues & Troubleshooting

### Issue: "Missing or invalid JWT token" (401)

**Possible Causes**:

1. **Client not sending cookies** (browser or test client issue)
   ```python
   # ❌ WRONG - Fresh session without login
   response = requests.get("/api/basic-io/export")
   
   # ✅ CORRECT - Use session that logged in
   session = requests.Session()
   session.post("/api/auth/login", json=credentials)
   response = session.get("/api/basic-io/export")  # Cookies auto-sent
   ```

2. **Cookies expired or invalid**
   ```bash
   # Check cookie expiration
   curl -i http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}' \
     | grep -i set-cookie
   ```

3. **Browser blocking cookies** (SameSite, Secure attributes)
   - Ensure SameSite=Lax for development
   - Check browser console for cookie warnings

### Issue: Only one cookie received (missing access_token or refresh_token)

**Root Cause**: Using `headers.set()` instead of `headers.append()` for Set-Cookie

**Fix**: Use `getSetCookie()` + `append()`

```typescript
// ❌ WRONG - Loses cookies
headers.set('set-cookie', cookie1);
headers.set('set-cookie', cookie2);  // Overwrites cookie1

// ✅ CORRECT - Keeps all
headers.append('set-cookie', cookie1);
headers.append('set-cookie', cookie2);
```

**Verification**: Check `lib/proxy/index.ts` lines 198-207

---

## Testing Checklist

### Unit Tests

- [x] Cookie header forwarded from client to backend
- [x] Multiple cookies preserved in request
- [x] Host header excluded from forwarded headers
- [x] Multiple Set-Cookie headers forwarded in response
- [x] Cookie attributes (HttpOnly, SameSite) preserved

### Integration Tests

- [ ] Login sets both access_token and refresh_token
- [ ] Protected endpoint accepts cookies and returns 200
- [ ] Expired token returns 401
- [ ] Missing cookie returns 401

### Manual Testing

```bash
# 1. Login and capture cookies
curl -i http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | grep -i set-cookie

# Expected: Two Set-Cookie headers (access_token + refresh_token)

# 2. Use cookies in protected request
curl -i http://localhost:3000/api/basic-io/export?url=... \
  -H "Cookie: access_token=<TOKEN>; refresh_token=<TOKEN>"

# Expected: HTTP 200 OK
```

---

## Security Considerations

### HttpOnly Cookies

All authentication cookies use `HttpOnly` flag:
- ✅ Prevents JavaScript access (XSS protection)
- ✅ Automatically sent by browser in requests
- ❌ Cannot be accessed via `document.cookie`

### SameSite Attribute

```
Set-Cookie: access_token=...; SameSite=Lax
```

- `Lax`: Sent with top-level navigation (links, redirects)
- Protects against CSRF attacks
- Compatible with OAuth flows

### Secure Flag (Production)

```
Set-Cookie: access_token=...; Secure; HttpOnly; SameSite=Lax
```

- `Secure`: Only sent over HTTPS
- Should be enabled in production
- Disabled in development for HTTP testing

---

## Files Reference

### Implementation
- `lib/proxy/index.ts` - Proxy core logic (bidirectional cookie handling)

### Tests
- `lib/proxy/index.test.ts` - Request cookie forwarding tests
- `app/api/auth/login/route.test.ts` - Response cookie forwarding tests
- `app/api/basic-io/export/route.test.ts` - Header forwarding tests

### Documentation
- `docs/fix-set-cookie-multiple-headers.md` - Set-Cookie bug fix
- `docs/proxy-header-forwarding-fixes-summary.md` - Complete session summary
- `docs/proxy-cookie-bidirectional-flow.md` - This document

---

## Test Results

**Total Tests**: 357 passing  
**Proxy Cookie Tests**: 4 passing  
**Auth Cookie Tests**: 8 passing  
**Build Status**: ✅ Successful

---

## Conclusion

✅ **Request cookies (Client → Backend)**: Correctly forwarded  
✅ **Response cookies (Backend → Client)**: Correctly forwarded  
✅ **Multiple cookies**: All preserved  
✅ **Cookie attributes**: HttpOnly, SameSite, Path preserved  
✅ **Security**: HttpOnly prevents XSS, SameSite prevents CSRF

The proxy correctly handles cookies in **both directions** with proper preservation of all values and attributes.
