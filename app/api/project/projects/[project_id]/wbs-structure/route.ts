import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}/wbs-structure`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        project: {
          id: project_id,
          name: 'Mock Project',
          status: 'active',
          company_id: '123e4567-e89b-12d3-a456-426614174001'
        },
        milestones: [],
        deliverables: [],
        associations: []
      }
    }
  });
}
