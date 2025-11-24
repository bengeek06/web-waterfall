/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';

jest.mock('@/lib/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GET /api/project/config', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let req: NextRequest;
  let mockFetch: jest.Mock;

  const buildReq = () => {
    return {
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
      url: 'http://localhost:3000/api/project/config',
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    req = buildReq();
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch;
    process.env.PROJECT_SERVICE_URL = PROJECT_SERVICE_URL;
    process.env.MOCK_API = 'false';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return configuration', async () => {
    const mockResponse = {
      env: 'development',
      debug: true,
      database_url: 'postgresql://***:***@localhost:5432/***',
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

    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.env).toBe('development');
    expect(data.debug).toBe(true);
  });
});
