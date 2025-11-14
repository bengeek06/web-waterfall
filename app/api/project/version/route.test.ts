/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GET /api/project/version', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let req: NextRequest;
  let mockFetch: jest.Mock;

  const buildReq = () => {
    return {
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
      url: 'http://localhost:3000/api/project/version',
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

  it('should return version information', async () => {
    const mockResponse = { version: '0.0.1' };

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
    expect(data.version).toBe('0.0.1');
  });

  it('should return mock response when MOCK_API=true', async () => {
    process.env.MOCK_API = 'true';

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();

    const data = await response.json();
    expect(data.version).toBe('0.0.1');
  });
});
