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
import { GET, PATCH } from './route';

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

describe('GET /api/storage/metadata', () => {
  it('should retrieve file metadata successfully', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/storage/metadata?bucket=users&id=user-123&logical_path=/docs/file.pdf',
      {
        method: 'GET',
      }
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('file_id');
    expect(data).toHaveProperty('bucket', 'users');
  });
});

describe('PATCH /api/storage/metadata', () => {
  it('should update file metadata successfully', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/storage/metadata?bucket=users&id=user-123&logical_path=/docs/file.pdf',
      {
        method: 'PATCH',
        body: JSON.stringify({
          tags: { category: 'documentation', priority: 'high' },
          description: 'Updated file description',
        }),
      }
    );

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data.data).toHaveProperty('file_id');
    expect(data.data).toHaveProperty('updated_fields');
  });
});
