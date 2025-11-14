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

import { fetchWithAuth, fetchWithAuthJSON } from './fetchWithAuth';

// Mock de fetch global
globalThis.fetch = jest.fn();

// Mock de Response
class MockResponse {
  private readonly body: string;
  public readonly status: number;
  public readonly ok: boolean;
  public readonly statusText: string;

  constructor(body: string | null, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
    this.body = body || '';
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init?.statusText || (this.ok ? 'OK' : 'Error');
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }

  clone() {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
    });
  }
}

globalThis.Response = MockResponse as unknown as typeof Response;

describe('fetchWithAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return response directly if status is not 401', async () => {
    const mockResponse = new MockResponse(JSON.stringify({ data: 'test' }), {
      status: 200,
    });
    
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const response = await fetchWithAuth('/api/test');
    
    expect(response.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should return 401 response if message does not contain "JWT token"', async () => {
    const mockResponse = new MockResponse(
      JSON.stringify({ message: 'Different error' }), 
      {
        status: 401,
      }
    );
    
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const response = await fetchWithAuth('/api/test');
    
    expect(response.status).toBe(401);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should attempt refresh and retry request on 401 with JWT error', async () => {
    // Premier appel: 401 avec erreur JWT
    const mock401Response = new MockResponse(
      JSON.stringify({ message: 'Missing or invalid JWT token' }), 
      {
        status: 401,
      }
    );
    
    // Deuxième appel: refresh réussit
    const mockRefreshResponse = new MockResponse(
      JSON.stringify({ success: true }), 
      {
        status: 200,
      }
    );
    
    // Troisième appel: retry réussit
    const mockRetryResponse = new MockResponse(
      JSON.stringify({ data: 'success' }), 
      {
        status: 200,
      }
    );

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(mock401Response)
      .mockResolvedValueOnce(mockRefreshResponse)
      .mockResolvedValueOnce(mockRetryResponse);

    const response = await fetchWithAuth('/api/test');
    
    expect(response.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/test', expect.any(Object));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, '/api/auth/refresh', expect.objectContaining({
      method: 'POST',
    }));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(3, '/api/test', expect.any(Object));
  });

  it('should include credentials by default', async () => {
    const mockResponse = new MockResponse(JSON.stringify({ data: 'test' }), {
      status: 200,
    });
    
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await fetchWithAuth('/api/test');
    
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      credentials: 'include',
    }));
  });
});

describe('fetchWithAuthJSON', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse JSON response on success', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const data = await fetchWithAuthJSON<typeof mockData>('/api/test');
    
    expect(data).toEqual(mockData);
  });

  it('should throw error on non-OK response', async () => {
    const mockResponse = new Response('Not Found', {
      status: 404,
    });
    
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await expect(fetchWithAuthJSON('/api/test')).rejects.toThrow('HTTP 404: Not Found');
  });
});
