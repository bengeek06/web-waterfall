import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string; role_id: string }> }
) {
  const { project_id, role_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/roles/${role_id}/policies`,
    method: 'GET',
    mock: {
      status: 200,
      body: []
    }
  });
}
