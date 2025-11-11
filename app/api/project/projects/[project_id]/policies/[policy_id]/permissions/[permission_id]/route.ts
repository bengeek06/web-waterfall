import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string; permission_id: string }> }
) {
  const { project_id, policy_id, permission_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}/permissions/${permission_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        policy_id: policy_id,
        permission_id: permission_id,
        associated: true,
        created_at: new Date().toISOString()
      }
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string; permission_id: string }> }
) {
  const { project_id, policy_id, permission_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}/permissions/${permission_id}`,
    method: 'POST',
    mock: {
      status: 201,
      body: {
        message: 'Association created successfully'
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; policy_id: string; permission_id: string }> }
) {
  const { project_id, policy_id, permission_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/policies/${policy_id}/permissions/${permission_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
