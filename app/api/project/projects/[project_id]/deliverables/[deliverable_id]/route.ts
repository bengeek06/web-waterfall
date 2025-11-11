import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; deliverable_id: string }> }
) {
  const { project_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/deliverables/${deliverable_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        id: deliverable_id,
        project_id: project_id,
        name: 'Mock Deliverable',
        type: 'document',
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; deliverable_id: string }> }
) {
  const { project_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/deliverables/${deliverable_id}`,
    method: 'PUT',
    mock: {
      status: 200,
      body: {
        id: deliverable_id,
        project_id: project_id,
        name: 'Updated Deliverable',
        type: 'document',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; deliverable_id: string }> }
) {
  const { project_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/deliverables/${deliverable_id}`,
    method: 'PATCH',
    mock: {
      status: 200,
      body: {
        id: deliverable_id,
        project_id: project_id,
        name: 'Partially Updated Deliverable',
        type: 'document',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; deliverable_id: string }> }
) {
  const { project_id, deliverable_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/deliverables/${deliverable_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
