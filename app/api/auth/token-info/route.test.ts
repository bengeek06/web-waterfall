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
 * @jest-environment node
 */

// Mock Next.js modules before importing the route
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { GET } from './route';
import { cookies } from 'next/headers';

describe('/api/auth/token-info', () => {
  const mockCookies = cookies as jest.Mock;

  // Helper pour créer un JWT factice
  const createMockJWT = (payload: object): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'mock-signature';
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() pour avoir un temps contrôlé
    jest.spyOn(Date, 'now').mockReturnValue(1234567000 * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 401 if no access token cookie', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'No access token found' });
  });

  it('should return 401 if token is invalid format', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Invalid token format' });
  });

  it('should return 401 if token has no exp claim', async () => {
    const token = createMockJWT({ sub: '123' }); // Pas de exp
    
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Invalid token format' });
  });

  it('should return token info for valid token', async () => {
    const exp = 1234567000 + 3600; // Expire dans 1 heure
    const iat = 1234567000 - 100;  // Émis il y a 100 secondes
    const sub = 'user-123';
    
    const token = createMockJWT({ exp, iat, sub });
    
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      expiresAt: exp,
      expiresIn: 3600,
      issuedAt: iat,
      userId: sub,
    });
  });

  it('should return negative expiresIn for expired token', async () => {
    const exp = 1234567000 - 100; // Expiré il y a 100 secondes
    const iat = 1234567000 - 4000;
    const sub = 'user-123';
    
    const token = createMockJWT({ exp, iat, sub });
    
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expiresIn).toBe(-100);
    expect(data.expiresAt).toBe(exp);
  });

  it('should handle token with company_id claim', async () => {
    const exp = 1234567000 + 3600;
    const iat = 1234567000;
    const sub = 'user-123';
    const company_id = 'company-456';
    
    const token = createMockJWT({ exp, iat, sub, company_id });
    
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe(sub);
    // company_id n'est pas retourné (seulement exp, iat, sub)
  });

  it('should handle base64url encoding correctly', async () => {
    // Créer un payload qui génère des caractères spéciaux en base64
    const exp = 1234567890;
    const iat = 1234567800;
    const sub = 'user-with-special-chars-äöü';
    
    const token = createMockJWT({ exp, iat, sub });
    
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe(sub);
  });
});
