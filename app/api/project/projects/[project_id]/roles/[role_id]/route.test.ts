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
const roleId = '123e4567-e89b-12d3-a456-426614174009';

describe('/api/project/projects/[project_id]/roles/[role_id]', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/roles/${roleId}`,
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
    it('should return role details', async () => {
      const req = buildReq();

      const mockResponse = {
        id: roleId,
        project_id: projectId,
        name: 'Project Manager',
        description: 'Manages the project',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await GET(req, {
        params: Promise.resolve({ project_id: projectId, role_id: roleId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(roleId);
      expect(data.name).toBe('Project Manager');
    });
  });

  describe('PUT', () => {
    it('should update role', async () => {
      const req = buildReq('PUT', JSON.stringify({ name: 'Senior Project Manager' }));

      const mockResponse = {
        id: roleId,
        project_id: projectId,
        name: 'Senior Project Manager',
        description: 'Manages the project',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PUT(req, {
        params: Promise.resolve({ project_id: projectId, role_id: roleId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH', () => {
    it('should partially update role', async () => {
      const req = buildReq('PATCH', JSON.stringify({ description: 'Updated description' }));

      const mockResponse = {
        id: roleId,
        project_id: projectId,
        name: 'Project Manager',
        description: 'Updated description',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PATCH(req, {
        params: Promise.resolve({ project_id: projectId, role_id: roleId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE', () => {
    it('should delete role', async () => {
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
        params: Promise.resolve({ project_id: projectId, role_id: roleId }),
      });

      expect(response.status).toBe(204);
    });
  });
});
