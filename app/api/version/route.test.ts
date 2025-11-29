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

import fs from 'fs';
import path from 'path';

// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
    })),
  },
}));

jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

// Import after mocks are set up
import { GET } from './route';

describe('GET /api/version', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockReturnValue('/mock/path/VERSION');
  });

  it('should return version from VERSION file', async () => {
    mockFs.readFileSync.mockReturnValue('1.2.3\n');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ version: '1.2.3' });
  });

  it('should trim whitespace from version', async () => {
    mockFs.readFileSync.mockReturnValue('  0.1.0  \n');

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBe('0.1.0');
  });

  it('should return 500 if VERSION file not found', async () => {
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Version file not found');
    expect(data.version).toBe('Unknown');
  });
});
