/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const projectId = '123e4567-e89b-12d3-a456-426614174000';

describe('POST /api/project/projects/[project_id]/archive', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = () => {
    return {
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/archive`,
      method: 'POST',
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch;
    process.env.PROJECT_SERVICE_URL = PROJECT_SERVICE_URL;
    process.env.MOCK_API = 'false';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should archive project', async () => {
    const req = buildReq();

    const mockResponse = {
      id: projectId,
      name: 'Archived Project',
      status: 'archived',
      archived_at: new Date().toISOString(),
      company_id: '123e4567-e89b-12d3-a456-426614174001',
      created_by: '123e4567-e89b-12d3-a456-426614174002',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => (key === 'content-type' ? 'application/json' : null),
      },
      json: jest.fn().mockResolvedValue(mockResponse),
      text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
    });

    const response = await POST(req, { params: Promise.resolve({ project_id: projectId }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('archived');
    expect(data.archived_at).toBeDefined();
  });
});
