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

describe('POST /api/project/check-project-access', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (body: string) => {
    return {
      text: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
      url: 'http://localhost:3000/api/project/check-project-access',
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

  it('should check project access permission', async () => {
    const req = buildReq(
      JSON.stringify({
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'write',
      })
    );

    const mockResponse = {
      allowed: true,
      role: 'owner',
      project_status: 'active',
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
    expect(data.allowed).toBe(true);
    expect(data.role).toBe('owner');
    expect(data.project_status).toBe('active');
  });
});
