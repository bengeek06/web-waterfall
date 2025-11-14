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

describe('GET /api/storage/versions', () => {
  it('should return list of file versions', async () => {
    const url = new URL('http://localhost:3000/api/storage/versions');
    url.searchParams.set('file_id', 'file-123');
    
    const req = new NextRequest(url);
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('versions');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.versions)).toBe(true);
    
    if (data.versions.length > 0) {
      const version = data.versions[0];
      expect(version).toHaveProperty('version_id');
      expect(version).toHaveProperty('file_id');
      expect(version).toHaveProperty('version_number');
      expect(version).toHaveProperty('status');
      expect(version).toHaveProperty('is_current');
    }
  });
});
