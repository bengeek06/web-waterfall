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
import { POST } from './route';

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

describe('POST /api/storage/lock', () => {
  it('should lock a file successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/storage/lock', {
      method: 'POST',
      body: JSON.stringify({
        file_id: 'file-123',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File locked successfully');
    expect(data).toHaveProperty('file_id');
    expect(data).toHaveProperty('locked_by');
  });
});
