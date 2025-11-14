/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, DELETE } from './route';

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const projectId = '123e4567-e89b-12d3-a456-426614174000';
const milestoneId = '123e4567-e89b-12d3-a456-426614174006';
const deliverableId = '123e4567-e89b-12d3-a456-426614174007';

describe('/api/project/projects/[project_id]/milestones/[milestone_id]/deliverables/[deliverable_id]', () => {
  const PROJECT_SERVICE_URL = 'http://project_service:5004';
  let mockFetch: jest.Mock;

  const buildReq = (method = 'GET') => {
    return {
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
      url: `http://localhost:3000/api/project/projects/${projectId}/milestones/${milestoneId}/deliverables/${deliverableId}`,
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
    it('should return association details', async () => {
      const req = buildReq();

      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174008',
        milestone_id: milestoneId,
        deliverable_id: deliverableId,
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
          milestone_id: milestoneId,
          deliverable_id: deliverableId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.milestone_id).toBe(milestoneId);
      expect(data.deliverable_id).toBe(deliverableId);
    });
  });

  describe('DELETE', () => {
    it('should remove deliverable from milestone', async () => {
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
          milestone_id: milestoneId,
          deliverable_id: deliverableId,
        }),
      });

      expect(response.status).toBe(204);
    });
  });
});
