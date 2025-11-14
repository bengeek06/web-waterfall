import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/projects',
    method: 'GET',
    mock: {
      status: 200,
      body: []
    }
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/projects',
    method: 'POST',
    mock: {
      status: 201,
      body: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'New Project',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        status: 'created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}
