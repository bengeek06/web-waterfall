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

jest.mock('@/lib/proxy', () => ({
  proxyRequest: jest.fn((req, config) => {
    return Promise.resolve(
      new Response(JSON.stringify(config.mock.body), {
        status: config.mock.status,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }),
}));

describe('GET /api/storage/list', () => {
  it('should return list of files with query parameters', async () => {
    const url = new URL('http://localhost:3000/api/storage/list');
    url.searchParams.set('bucket', 'projects');
    url.searchParams.set('id', 'project-123');
    
    const req = new NextRequest(url);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('files');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
    expect(Array.isArray(data.files)).toBe(true);
  });

  it('should handle empty file list', async () => {
    const req = new NextRequest('http://localhost:3000/api/storage/list?bucket=users&id=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.files).toEqual([]);
    expect(data.total).toBe(0);
  });
});
