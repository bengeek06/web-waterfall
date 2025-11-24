/**
 * @jest-environment node
 */
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

import { proxyRequest } from './index';
import { NextRequest } from 'next/server';

// Mock logger to avoid noise in tests
jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Proxy Cookie Forwarding', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.MOCK_API = 'false';
    process.env.TEST_SERVICE_URL = 'http://test_service:5000';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should forward Cookie header from client to backend service', async () => {
    // Create request with authentication cookies
    const req = new NextRequest(
      'http://localhost:3000/api/test/endpoint',
      {
        method: 'GET',
        headers: {
          'cookie': 'access_token=eyJhbGc...; refresh_token=8_ittp...',
          'accept': 'application/json',
        },
      }
    );

    // Mock fetch to capture what was sent to backend
    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    global.fetch = mockFetch;

    // Call proxy
    await proxyRequest(req, {
      service: 'TEST_SERVICE_URL',
      path: '/endpoint',
      method: 'GET',
      mock: {
        status: 200,
        body: { data: 'mock' },
      },
    });

    // Verify fetch was called with Cookie header
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test_service:5000/endpoint',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'cookie': 'access_token=eyJhbGc...; refresh_token=8_ittp...',
        }),
      })
    );
  });

  it('should forward empty Cookie header if client has no cookies', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/test/endpoint',
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          // No cookie header
        },
      }
    );

    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    global.fetch = mockFetch;

    await proxyRequest(req, {
      service: 'TEST_SERVICE_URL',
      path: '/endpoint',
      method: 'GET',
      mock: {
        status: 200,
        body: { data: 'mock' },
      },
    });

    // Verify fetch was called (cookie header should be absent or empty)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test_service:5000/endpoint',
      expect.objectContaining({
        method: 'GET',
      })
    );

    // The headers object should NOT have a cookie property, or it should be empty
    const callArgs = mockFetch.mock.calls[0][1];
    const headers = callArgs?.headers as Record<string, string>;
    
    // If cookie is present, it should be empty or undefined
    if ('cookie' in headers) {
      expect(headers.cookie).toBeFalsy();
    }
  });

  it('should NOT forward Host header to backend', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/test/endpoint',
      {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'cookie': 'access_token=test',
        },
      }
    );

    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    global.fetch = mockFetch;

    await proxyRequest(req, {
      service: 'TEST_SERVICE_URL',
      path: '/endpoint',
      method: 'GET',
      mock: {
        status: 200,
        body: { data: 'mock' },
      },
    });

    // Verify Host header was NOT forwarded
    const callArgs = mockFetch.mock.calls[0][1];
    const headers = callArgs?.headers as Record<string, string>;
    
    expect(headers).not.toHaveProperty('host');
    
    // But cookie should still be there
    expect(headers).toHaveProperty('cookie', 'access_token=test');
  });

  it('should forward multiple cookies including access_token and refresh_token', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/basic-io/export',
      {
        method: 'GET',
        headers: {
          'cookie': 'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIn0.abc; refresh_token=def123',
          'accept': 'application/json',
        },
      }
    );

    const mockFetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 
          'content-type': 'application/json',
          'content-disposition': 'attachment; filename="export.json"'
        },
      })
    );
    global.fetch = mockFetch;

    const response = await proxyRequest(req, {
      service: 'TEST_SERVICE_URL',
      path: '/export',
      method: 'GET',
      mock: {
        status: 200,
        body: { data: [] },
      },
    });

    // Verify cookies were forwarded to backend
    const callArgs = mockFetch.mock.calls[0][1];
    const headers = callArgs?.headers as Record<string, string>;
    
    expect(headers).toHaveProperty('cookie');
    expect(headers.cookie).toContain('access_token=');
    expect(headers.cookie).toContain('refresh_token=');
    
    // Verify response is OK
    expect(response.status).toBe(200);
  });
});
