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

describe('/api/project/projects/[project_id]', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (url: string, method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url,
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
    it('should return project details', async () => {
      const req = buildReq(`http://localhost:3000/api/project/projects/${projectId}`);

      const mockResponse = {
        id: projectId,
        name: 'Mock Project',
        status: 'active',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await GET(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(projectId);
      expect(data.status).toBe('active');
    });
  });

  describe('PUT', () => {
    it('should update project', async () => {
      const req = buildReq(
        `http://localhost:3000/api/project/projects/${projectId}`,
        'PUT',
        JSON.stringify({ name: 'Updated Name' })
      );

      const mockResponse = {
        id: projectId,
        name: 'Updated Project',
        status: 'active',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PUT(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(projectId);
    });
  });

  describe('PATCH', () => {
    it('should partially update project', async () => {
      const req = buildReq(
        `http://localhost:3000/api/project/projects/${projectId}`,
        'PATCH',
        JSON.stringify({ status: 'suspended' })
      );

      const mockResponse = {
        id: projectId,
        name: 'Partially Updated Project',
        status: 'suspended',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await PATCH(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(projectId);
    });
  });

  describe('DELETE', () => {
    it('should delete project', async () => {
      const req = buildReq(
        `http://localhost:3000/api/project/projects/${projectId}`,
        'DELETE'
      );

      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: {
          get: () => null,
        },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(''),
      });

      const response = await DELETE(req, { params: Promise.resolve({ project_id: projectId }) });

      expect(response.status).toBe(204);
    });
  });
});
