import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/archive`,
    method: 'POST',
    mock: {
      status: 200,
      body: {
        id: project_id,
        name: 'Archived Project',
        status: 'archived',
        archived_at: new Date().toISOString(),
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}
