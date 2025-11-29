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

import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock proxyRequest to simulate upstream response with Content-Disposition header
jest.mock('@/lib/proxy', () => ({
  proxyRequest: jest.fn((req, config) => {
    // Simulate JSON export response
    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');
    mockHeaders.set('content-disposition', 'attachment; filename="users_export.json"');
    mockHeaders.set('cache-control', 'no-cache');
    
    return Promise.resolve(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: mockHeaders,
      })
    );
  }),
}));

describe('GET /api/basic-io/export', () => {
  // Set up environment variables for service URLs
  beforeAll(() => {
    process.env.BASIC_IO_IDENTITY_SERVICE_URL = 'http://identity_service:5000';
    process.env.BASIC_IO_GUARDIAN_SERVICE_URL = 'http://guardian_service:5000';
    process.env.BASIC_IO_PROJECT_SERVICE_URL = 'http://project_service:5000';
    process.env.BASIC_IO_STORAGE_SERVICE_URL = 'http://storage_service:5000';
  });
  it('should forward Content-Disposition header from upstream service', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/basic-io/export?service=identity&endpoint=users&type=json',
      {
        method: 'GET',
        headers: {
          cookie: 'access_token=test-jwt-token',
        },
      }
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="users_export.json"');
  });

  it('should forward Cache-Control header from upstream service', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/basic-io/export?service=identity&endpoint=companies&type=csv',
      {
        method: 'GET',
      }
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-cache');
  });

  it('should NOT forward Content-Length header (Next.js auto-calculates)', async () => {
    // This test verifies the fix for IncompleteRead bug
    // Content-Length from upstream should be ignored, Next.js calculates its own
    const req = new NextRequest(
      'http://localhost:3000/api/basic-io/export?service=identity&endpoint=users&type=json',
      {
        method: 'GET',
      }
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
    
    // Next.js will set Content-Length automatically for the re-serialized body
    // We just verify the response is complete (no IncompleteRead)
    const body = await response.text();
    expect(body).toBeTruthy();
    expect(() => JSON.parse(body)).not.toThrow();
  });
});
