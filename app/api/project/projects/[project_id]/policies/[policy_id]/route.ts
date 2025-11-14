import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string }> }
) {
  const { project_id, policy_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        id: policy_id,
        project_id: project_id,
        name: 'Mock Policy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string }> }
) {
  const { project_id, policy_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}`,
    method: 'PUT',
    mock: {
      status: 200,
      body: {
        id: policy_id,
        project_id: project_id,
        name: 'Updated Policy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string }> }
) {
  const { project_id, policy_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}`,
    method: 'PATCH',
    mock: {
      status: 200,
      body: {
        id: policy_id,
        project_id: project_id,
        name: 'Partially Updated Policy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string }> }
) {
  const { project_id, policy_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
