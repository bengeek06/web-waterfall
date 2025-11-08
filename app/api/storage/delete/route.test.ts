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
import { DELETE } from './route';

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

describe('DELETE /api/storage/delete', () => {
  it('should delete a file successfully', async () => {
    const url = new URL('http://localhost:3000/api/storage/delete');
    url.searchParams.set('file_id', 'file-123');
    
    const req = new NextRequest(url, {
      method: 'DELETE',
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'File deleted successfully');
  });
});
