import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/config',
    method: 'GET',
    mock: {
      status: 200,
      body: {
        env: 'development',
        debug: true,
        database_url: 'postgresql://***:***@localhost:5432/***'
      }
    }
  });
}
