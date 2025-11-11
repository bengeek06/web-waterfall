/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PUT, PATCH, DELETE } from './route';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const projectId = '123e4567-e89b-12d3-a456-426614174000';
const userId = '123e4567-e89b-12d3-a456-426614174004';

describe('/api/project/projects/[project_id]/members/[user_id]', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/members/${userId}`,
      method,
    } as unknown as NextRequest;
  };

  const createMockResponse = (data: unknown, status = 200) => ({
    ok: true,
    status,
    headers: {
      get: (key: string) => (key === 'content-type' ? 'application/json' : null),
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  });

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
    it('should return member details', async () => {
      const req = buildReq();

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: projectId,
        user_id: userId,
        role_id: '123e4567-e89b-12d3-a456-426614174005',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await GET(req, {
        params: Promise.resolve({ project_id: projectId, user_id: userId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user_id).toBe(userId);
    });
  });

  describe('PUT', () => {
    it('should update member', async () => {
      const req = buildReq('PUT', JSON.stringify({ role_id: 'new-role-id' }));

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: projectId,
        user_id: userId,
        role_id: 'new-role-id',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PUT(req, {
        params: Promise.resolve({ project_id: projectId, user_id: userId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should partially update member', async () => {
      const req = buildReq('PATCH', JSON.stringify({ role_id: 'new-role-id' }));

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: projectId,
        user_id: userId,
        role_id: 'new-role-id',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PATCH(req, {
        params: Promise.resolve({ project_id: projectId, user_id: userId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE', () => {
    it('should remove member', async () => {
      const req = buildReq('DELETE');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: {
          get: () => null,
        },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(''),
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ project_id: projectId, user_id: userId }),
      });

      expect(response.status).toBe(204);
    });
  });
});
