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

describe('POST /api/project/check-project-access-batch', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: 'http://localhost:3000/api/project/check-project-access-batch',
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

  it('should check project access for multiple projects', async () => {
    const req = buildReq(
      JSON.stringify({
        user_id: '123e4567-e89b-12d3-a456-426614174002',
        project_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
        required_permission: 'project:read',
      })
    );

    const mockResponse = {
      results: [
        {
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          has_access: true,
        },
        {
          project_id: '123e4567-e89b-12d3-a456-426614174001',
          has_access: false,
        },
      ],
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

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.results[0].project_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(data.results[0].has_access).toBe(true);
  });
});
