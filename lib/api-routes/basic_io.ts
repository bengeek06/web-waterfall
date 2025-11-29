/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

/**
 * Basic I/O Service API routes
 * @see https://github.com/bengeek06/basic-io-api-waterfall/blob/develop/openapi.yml
 */

const BASE = '/api/basic-io';

export const BASIC_IO_ROUTES = {
  // System endpoints
  health: `${BASE}/health`,
  version: `${BASE}/version`,
  config: `${BASE}/config`,
  
  // Import/Export endpoints
  export: `${BASE}/export`,
  import: `${BASE}/import`,
  
  // Schema registry endpoints
  schemas: `${BASE}/schemas`,
  schema: (name: string) => `${BASE}/schemas/${encodeURIComponent(name)}`,
};

/**
 * Build export URL with query parameters
 */
export function buildExportUrl(options: {
  service: string;
  endpoint: string;
  type?: 'json' | 'csv';
  enrich?: boolean;
  tree?: boolean;
  ids?: string[];
  associations?: string;
}): string {
  const params = new URLSearchParams();
  params.set('service', options.service);
  params.set('endpoint', options.endpoint);
  
  if (options.type) params.set('type', options.type);
  if (options.enrich !== undefined) params.set('enrich', String(options.enrich));
  if (options.tree !== undefined) params.set('tree', String(options.tree));
  if (options.ids?.length) params.set('ids', options.ids.join(','));
  if (options.associations) params.set('associations', options.associations);
  
  return `${BASIC_IO_ROUTES.export}?${params.toString()}`;
}

/**
 * Build import URL with query parameters
 */
export function buildImportUrl(options: {
  service: string;
  endpoint: string;
  type?: 'json' | 'csv';
  resolve_refs?: boolean;
  on_ambiguous?: 'skip' | 'fail';
  on_missing?: 'skip' | 'fail';
  associations_mode?: 'skip' | 'merge' | 'recreate';
}): string {
  const params = new URLSearchParams();
  params.set('service', options.service);
  params.set('endpoint', options.endpoint);
  
  if (options.type) params.set('type', options.type);
  if (options.resolve_refs !== undefined) params.set('resolve_refs', String(options.resolve_refs));
  if (options.on_ambiguous) params.set('on_ambiguous', options.on_ambiguous);
  if (options.on_missing) params.set('on_missing', options.on_missing);
  if (options.associations_mode) params.set('associations_mode', options.associations_mode);
  
  return `${BASIC_IO_ROUTES.import}?${params.toString()}`;
}
