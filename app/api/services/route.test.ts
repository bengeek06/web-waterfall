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

// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      status: 200,
      json: async () => data,
    })),
  },
}));

import { GET, BACKEND_SERVICES } from './route';

describe('GET /api/services', () => {
  it('should return list of backend services', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.services).toBeDefined();
    expect(Array.isArray(data.services)).toBe(true);
  });

  it('should include all expected services', async () => {
    const response = await GET();
    const data = await response.json();

    const serviceNames = data.services.map((s: { name: string }) => s.name);
    
    expect(serviceNames).toContain('Auth Service');
    expect(serviceNames).toContain('Identity Service');
    expect(serviceNames).toContain('Guardian Service');
    expect(serviceNames).toContain('Storage Service');
    expect(serviceNames).toContain('Basic I/O Service');
    expect(serviceNames).toContain('Project Service');
  });

  it('should have valid endpoint format for each service', async () => {
    const response = await GET();
    const data = await response.json();

    data.services.forEach((service: { name: string; endpoint: string }) => {
      expect(service.endpoint).toMatch(/^\/api\/[a-z-]+\/version$/);
    });
  });

  it('BACKEND_SERVICES should be exported and match response', async () => {
    const response = await GET();
    const data = await response.json();

    expect(BACKEND_SERVICES).toBeDefined();
    expect(data.services).toEqual(BACKEND_SERVICES);
  });
});
