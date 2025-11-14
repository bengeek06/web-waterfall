import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/roles`,
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
    path: `/projects/${project_id}/roles`,
    method: 'POST',
    mock: {
      status: 201,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174020',
        project_id: project_id,
        name: 'Custom Role',
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}
