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
 */

const BASE = '/api/basic_io';

export const BASIC_IO_ROUTES = {
  // System endpoints
  health: `${BASE}/health`,
  version: `${BASE}/version`,
  config: `${BASE}/config`,
  
  // Import/Export endpoints
  export: `${BASE}/export`,
  import: `${BASE}/import`,
};
