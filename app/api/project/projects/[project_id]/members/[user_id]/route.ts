import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; user_id: string }> }
) {
  const { project_id, user_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members/${user_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: project_id,
        user_id: user_id,
        role_id: '123e4567-e89b-12d3-a456-426614174005',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString()
      }
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; user_id: string }> }
) {
  const { project_id, user_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members/${user_id}`,
    method: 'PUT',
    mock: {
      status: 200,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: project_id,
        user_id: user_id,
        role_id: '123e4567-e89b-12d3-a456-426614174005',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString()
      }
    }
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; user_id: string }> }
) {
  const { project_id, user_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members/${user_id}`,
    method: 'PATCH',
    mock: {
      status: 200,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: project_id,
        user_id: user_id,
        role_id: '123e4567-e89b-12d3-a456-426614174005',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; user_id: string }> }
) {
  const { project_id, user_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members/${user_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
