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
const milestoneId = '123e4567-e89b-12d3-a456-426614174006';

describe('/api/project/projects/[project_id]/milestones/[milestone_id]/deliverables', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET', body?: string) => {
    return {
      text: jest.fn().mockResolvedValue(body || ''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/milestones/${milestoneId}/deliverables`,
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
    it('should return list of deliverables for milestone', async () => {
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

      const response = await GET(req, {
        params: Promise.resolve({ project_id: projectId, milestone_id: milestoneId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should associate deliverable with milestone', async () => {
      const req = buildReq(
        'POST',
        JSON.stringify({
          deliverable_id: '123e4567-e89b-12d3-a456-426614174007',
        })
      );

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174008',
        milestone_id: milestoneId,
        deliverable_id: '123e4567-e89b-12d3-a456-426614174007',
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
        params: Promise.resolve({ project_id: projectId, milestone_id: milestoneId }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.milestone_id).toBe(milestoneId);
    });
  });
});
