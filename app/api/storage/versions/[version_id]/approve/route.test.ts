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

describe('POST /api/storage/versions/[version_id]/approve', () => {
  it('should approve a version successfully', async () => {
    const version_id = 'version-123';
    const req = new NextRequest(`http://localhost:3000/api/storage/versions/${version_id}/approve`, {
      method: 'POST',
    });

    const response = await POST(req, { params: Promise.resolve({ version_id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('message', 'Version approved successfully');
    expect(data).toHaveProperty('version_id', version_id);
    expect(data).toHaveProperty('approved_at');
  });
});
