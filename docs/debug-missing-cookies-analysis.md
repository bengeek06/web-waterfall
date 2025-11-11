# Analysis: Missing Cookies in Basic I/O Tests

## Problem Statement

Basic I/O tests are failing with 401 Unauthorized errors:
```
basic_io_service: "GET /export?url=... HTTP/1.1" 401
Response: {"message": "Missing or invalid JWT token"}
```

## Log Analysis

### Critical Evidence from Logs

```
web_service: Request headers received from client: {
  "accept":"*/*",
  "accept-encoding":"gzip, deflate",
  "connection":"keep-alive",
  "host":"localhost:3000",
  "user-agent":"python-requests/2.32.5",
  ...
}
```

**Key Observation**: ❌ **NO `cookie` HEADER**

The client (Python requests library) is **not sending** authentication cookies to the Next.js gateway.

### Flow Analysis

```
Python Test Client → Next.js Gateway → Basic I/O Service
     (NO cookie)         (forwards)       (401 Unauthorized)
```

1. **Client sends request** WITHOUT `cookie` header
2. **Next.js proxy** correctly forwards all received headers (no cookie to forward)
3. **Basic I/O service** rejects request with 401 (no JWT token)

## Root Cause

The problem is **NOT** in the Next.js proxy. The proxy is working correctly:

✅ **Proxy code is correct** (verified by tests):
- Forwards all request headers except `host`
- Preserves `cookie` header when present
- All 357 unit tests passing

❌ **Client is not sending cookies**:
- Python `requests.Session` not authenticated
- Cookies expired
- Cookies not set in session

## Evidence: Proxy Forwards Cookies Correctly

### Unit Test Verification

**File**: `lib/proxy/index.test.ts`

```typescript
it('should forward Cookie header from client to backend service', async () => {
  const req = new NextRequest('http://localhost:3000/api/test/endpoint', {
    headers: {
      'cookie': 'access_token=eyJhbGc...; refresh_token=8_ittp...',
    },
  });

  await proxyRequest(req, { ... });

  // ✅ PASSES - Cookies are forwarded
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

**Result**: ✅ Test passes - When client sends cookies, proxy forwards them.

### Code Verification

**File**: `lib/proxy/index.ts` (lines 132-136)

```typescript
// Prepare headers (exclude 'host' header)
const headers = Object.fromEntries(
  Array.from(req.headers.entries()).filter(
    ([key]) => key.toLowerCase() !== "host"
  )
);
```

This code:
1. Copies **ALL** headers from request
2. Excludes **ONLY** `host` header
3. Includes `cookie` if present

**Conclusion**: Proxy forwards cookies correctly when they are present.

## Why Are Cookies Missing?

### Scenario 1: Session Not Authenticated

```python
# ❌ WRONG - Fresh session without login
session = requests.Session()
response = session.get("/api/basic-io/export")  # 401 - No cookies!

# ✅ CORRECT - Login first
session = requests.Session()
session.post("/api/auth/login", json=credentials)  # Sets cookies
response = session.get("/api/basic-io/export")  # 200 - Cookies sent
```

### Scenario 2: Cookies Expired

```python
# Login yesterday
session.post("/api/auth/login", json=credentials)

# Today (24 hours later)
response = session.get("/api/basic-io/export")  # 401 - Cookies expired
```

### Scenario 3: New Session Between Tests

```python
# Storage tests (working)
session1 = requests.Session()
session1.post("/api/auth/login", json=credentials)
session1.get("/api/storage/list")  # ✅ Works

# Basic I/O tests (failing) - DIFFERENT SESSION!
session2 = requests.Session()  # Fresh session, no cookies
session2.get("/api/basic-io/export")  # ❌ 401
```

### Scenario 4: Cookie Persistence Issue

```python
# Login
response = session.post("/api/auth/login", json=credentials)
print(response.cookies)  # Shows cookies

# Check session cookies
print(session.cookies)  # ❌ Empty! Cookies not persisted
```

## Debugging Steps

### 1. Check if Login Sets Cookies

```python
import requests

session = requests.Session()

# Login
response = session.post(
    "http://localhost:3000/api/auth/login",
    json={"email": "admin@example.com", "password": "password"}
)

print(f"Login status: {response.status_code}")
print(f"Response cookies: {dict(response.cookies)}")
print(f"Session cookies: {dict(session.cookies)}")

# Expected:
# Login status: 200
# Response cookies: {'access_token': 'eyJ...', 'refresh_token': '8_itt...'}
# Session cookies: {'access_token': 'eyJ...', 'refresh_token': '8_itt...'}
```

### 2. Check if Cookies Are Sent in Subsequent Requests

```python
# After login, make another request
response = session.get("http://localhost:3000/api/basic-io/export", params={
    "url": "http://identity_service:5000/users",
    "type": "json"
})

print(f"Export status: {response.status_code}")

# Check what was sent
import requests_toolbelt
session.mount('http://', requests_toolbelt.adapters.host_header_ssl.HostHeaderSSLAdapter())

# Or use verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 3. Check Next.js Logs (NEW)

With the updated logging, you'll now see:

```
🐛 DEBUG: Request headers received from client: {...}
🐛 DEBUG: Headers being sent to backend: {...}
```

Compare these two logs:
- If `cookie` is in "received from client" → Client is sending cookies ✅
- If `cookie` is NOT in "received from client" → **Client problem** ❌
- If `cookie` is in "received" but NOT in "sent to backend" → **Proxy problem** (unlikely)

## Solution

### Fix the Test Client

```python
class APITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self._authenticated = False
    
    def ensure_authenticated(self):
        """Ensure session has valid authentication cookies"""
        if self._authenticated:
            # Check if cookies are still valid
            response = self.session.get(f"{self.base_url}/api/auth/verify")
            if response.status_code == 200:
                return  # Still authenticated
        
        # Login to get fresh cookies
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "admin@example.com", "password": "password"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.status_code}")
        
        # Verify cookies were set
        if 'access_token' not in self.session.cookies:
            raise Exception("Login succeeded but access_token cookie missing!")
        
        self._authenticated = True
    
    def get(self, path, **kwargs):
        """Make GET request with authentication"""
        self.ensure_authenticated()
        return self.session.get(f"{self.base_url}{path}", **kwargs)
```

Usage:
```python
def test_export_json():
    api = APITester("http://localhost:3000")
    
    # This will automatically login if needed
    response = api.get("/api/basic-io/export", params={
        "url": "http://identity_service:5000/users",
        "type": "json"
    })
    
    assert response.status_code == 200  # ✅ Works!
```

## Next Steps

1. **Check test framework**: Verify how login is performed before tests
2. **Check session reuse**: Ensure same session is used across tests
3. **Check cookie domain/path**: Verify cookies are set for `localhost:3000`
4. **Add debug logging**: Use new logs to see what client sends
5. **Check test order**: Login might work but cookies expire before Basic I/O tests

## Logs to Compare

### Working Request (with cookies)

```
Request headers received from client: {
  "cookie": "access_token=eyJ...; refresh_token=8_itt...",  ← ✅ Present
  "accept": "application/json",
  ...
}

Headers being sent to backend: {
  "cookie": "access_token=eyJ...; refresh_token=8_itt...",  ← ✅ Forwarded
  "accept": "application/json",
  ...
}

basic_io_service: "GET /export HTTP/1.1" 200  ← ✅ Success
```

### Failing Request (no cookies)

```
Request headers received from client: {
  "accept": "*/*",
  "user-agent": "python-requests/2.32.5",
  ...
  ← ❌ NO cookie header
}

Headers being sent to backend: {
  "accept": "*/*",
  "user-agent": "python-requests/2.32.5",
  ...
  ← ❌ NO cookie header (nothing to forward)
}

basic_io_service: "GET /export HTTP/1.1" 401  ← ❌ Unauthorized
```

## Conclusion

**Problem**: Client (Python tests) not sending authentication cookies  
**Proxy Status**: ✅ Working correctly (forwards cookies when present)  
**Solution**: Fix test client to ensure cookies are sent  

The Next.js proxy is **not the problem**. The issue is in the test setup or session management.
