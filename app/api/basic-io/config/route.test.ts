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

describe('GET /api/basic-io/config', () => {
  it('should return configuration information', async () => {
    const req = new NextRequest('http://localhost:3000/api/basic-io/config');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      service: 'basic_io',
      features: {
        export: true,
        import: true,
        formats: ['json', 'csv', 'mermaid']
      }
    });
  });
});
