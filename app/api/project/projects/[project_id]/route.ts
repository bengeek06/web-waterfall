import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}`,
    method: 'GET',
    mock: {
      status: 200,
      body: {
        id: project_id,
        name: 'Mock Project',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}`,
    method: 'PUT',
    mock: {
      status: 200,
      body: {
        id: project_id,
        name: 'Updated Project',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}`,
    method: 'PATCH',
    mock: {
      status: 200,
      body: {
        id: project_id,
        name: 'Partially Updated Project',
        company_id: '123e4567-e89b-12d3-a456-426614174001',
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  const { project_id } = await params;
  
  return proxyRequest(req, {
    service: 'PROJECT_SERVICE_URL',
    path: `/projects/${project_id}`,
    method: 'DELETE',
    mock: {
      status: 204,
      body: ''
    }
  });
}
