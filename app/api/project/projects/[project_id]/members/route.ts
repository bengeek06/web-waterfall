import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members`,
    method: 'GET',
    mock: {
      status: 200,
      body: []
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/members`,
    method: 'POST',
    mock: {
      status: 201,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        project_id: project_id,
        user_id: '123e4567-e89b-12d3-a456-426614174004',
        role_id: '123e4567-e89b-12d3-a456-426614174005',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        added_at: new Date().toISOString()
      }
    }
  });
}
