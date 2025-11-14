import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: '/health',
    method: 'GET',
    mock: {
      status: 200,
      body: {
        status: 'healthy',
        service: 'project_service',
        timestamp: new Date().toISOString(),
        version: '0.0.1',
        environment: 'development',
        checks: {
          database: {
            healthy: true,
            message: 'Connected',
            response_time_ms: 5.2
          }
        }
      }
    }
  });
}
