/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

jest.mock('@/lib/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const projectId = '123e4567-e89b-12d3-a456-426614174000';

describe('/api/project/projects/[project_id]/roles', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/roles`,
      method,
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

  describe('GET', () => {
    it('should return list of roles', async () => {
      const req = buildReq();
      const mockResponse: unknown[] = [];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: jest.fn().mockResolvedValue(mockResponse),
        text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      });

      const response = await GET(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should create a role', async () => {
      const req = buildReq(
        'POST',
        JSON.stringify({
          name: 'Project Manager',
          description: 'Manages the project',
        })
      );

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174009',
        project_id: projectId,
        name: 'Project Manager',
        description: 'Manages the project',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        json: jest.fn().mockResolvedValue(mockResponse),
        text: jest.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      });

      const response = await POST(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Project Manager');
      expect(data.project_id).toBe(projectId);
    });
  });
});
