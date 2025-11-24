/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from './route';

jest.mock('@/lib/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const projectId = '123e4567-e89b-12d3-a456-426614174000';
const policyId = '123e4567-e89b-12d3-a456-426614174010';
const permissionId = '123e4567-e89b-12d3-a456-426614174012';

describe('/api/project/projects/[project_id]/policies/[policy_id]/permissions/[policy_id]', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/policies/${policyId}/permissions/${permissionId}`,
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
    it('should return policy-permission association', async () => {
      const req = buildReq();

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174013',
        policy_id: policyId,
        permission_id: permissionId,
        created_at: new Date().toISOString(),
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

      const response = await GET(req, {
        params: Promise.resolve({
          project_id: projectId,
          policy_id: policyId,
          permission_id: permissionId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.policy_id).toBe(policyId);
      expect(data.permission_id).toBe(permissionId);
    });
  });

  describe('POST', () => {
    it('should associate permission with policy', async () => {
      const req = buildReq('POST');

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174013',
        policy_id: policyId,
        permission_id: permissionId,
        created_at: new Date().toISOString(),
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

      const response = await POST(req, {
        params: Promise.resolve({
          project_id: projectId,
          policy_id: policyId,
          permission_id: permissionId,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.policy_id).toBe(policyId);
      expect(data.permission_id).toBe(permissionId);
    });
  });

  describe('DELETE', () => {
    it('should remove permission from policy', async () => {
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
        params: Promise.resolve({
          project_id: projectId,
          policy_id: policyId,
          permission_id: permissionId,
        }),
      });

      expect(response.status).toBe(204);
    });
  });
});
