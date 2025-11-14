import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; milestone_id: string }> }
) {
  const { project_id, milestone_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/milestones/${milestone_id}/deliverables`,
    method: 'GET',
    mock: {
      status: 200,
      body: []
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; milestone_id: string }> }
) {
  const { project_id, milestone_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/milestones/${milestone_id}/deliverables`,
    method: 'POST',
    mock: {
      status: 201,
      body: {
        milestone_id: milestone_id,
        deliverable_id: '123e4567-e89b-12d3-a456-426614174011',
        created_at: new Date().toISOString()
      }
    }
  });
}
