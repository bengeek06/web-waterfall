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
 * Centralized test IDs for E2E testing
 * Import from here to use test IDs across the application
 */

export * from './auth';
export * from './common';
export * from './dashboard';
export * from './admin';
export * from './table';
export * from './pages';
export * from './shared';
export * from './about';

// Re-export helper function
export { testId } from './auth';

// Consolidated TEST_IDS object
import { AUTH_TEST_IDS } from './auth';
import { COMMON_TEST_IDS } from './common';
import { DASHBOARD_TEST_IDS } from './dashboard';
import { ADMIN_TEST_IDS } from './admin';
import { TABLE_TEST_IDS } from './table';
import { PAGES_TEST_IDS } from './pages';
import { SHARED_TEST_IDS } from './shared';
import { ABOUT_TEST_IDS } from './about';

export const TEST_IDS = {
  auth: AUTH_TEST_IDS,
  common: COMMON_TEST_IDS,
  dashboard: DASHBOARD_TEST_IDS,
  admin: ADMIN_TEST_IDS,
  table: TABLE_TEST_IDS,
  pages: PAGES_TEST_IDS,
  shared: SHARED_TEST_IDS,
  about: ABOUT_TEST_IDS,
} as const;
