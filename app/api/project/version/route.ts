import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/version',
    method: 'GET',
    mock: {
      status: 200,
      body: { version: '0.0.1' }
    }
  });
}
