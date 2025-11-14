import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/check-project-access',
    method: 'POST',
    mock: {
      status: 200,
      body: {
        allowed: true,
        role: 'owner',
        project_status: 'active'
      }
    }
  });
}
