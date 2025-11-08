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
 * Storage Service API Routes
 */

const BASE = '/api/storage';

export const STORAGE_ROUTES = {
  // System
  health: `${BASE}/health`,
  version: `${BASE}/version`,
  config: `${BASE}/config`,

  // Files
  list: `${BASE}/list`,
  metadata: `${BASE}/metadata`,

  // Upload
  uploadPresign: `${BASE}/upload/presign`,
  uploadProxy: `${BASE}/upload/proxy`,

  // Download
  downloadPresign: `${BASE}/download/presign`,
  downloadProxy: `${BASE}/download/proxy`,

  // Collaboration
  copy: `${BASE}/copy`,
  lock: `${BASE}/lock`,
  unlock: `${BASE}/unlock`,
  locks: `${BASE}/locks`,

  // Versioning
  versions: `${BASE}/versions`,
  versionsCommit: `${BASE}/versions/commit`,
  versionApprove: (versionId: string) => `${BASE}/versions/${versionId}/approve`,
  versionReject: (versionId: string) => `${BASE}/versions/${versionId}/reject`,

  // Administration
  delete: `${BASE}/delete`,
} as const;
