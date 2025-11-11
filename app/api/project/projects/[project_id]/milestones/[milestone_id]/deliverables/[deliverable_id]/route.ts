import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; milestone_id: string; deliverable_id: string }> }
) {
  const { project_id, milestone_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/milestones/${milestone_id}/deliverables/${deliverable_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        milestone_id: milestone_id,
        deliverable_id: deliverable_id,
        created_at: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; milestone_id: string; deliverable_id: string }> }
) {
  const { project_id, milestone_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/milestones/${milestone_id}/deliverables/${deliverable_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
