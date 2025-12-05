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
export * from './home-cards';
export * from './company';
export * from './settings';
export * from './file-explorer';
export * from './organization-tree';
export * from './profile';
export * from './page-breadcrumb';

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
import { HOME_CARDS_TEST_IDS } from './home-cards';
import { COMPANY_TEST_IDS } from './company';
import { SETTINGS_TEST_IDS } from './settings';
import { FILE_EXPLORER_TEST_IDS } from './file-explorer';
import { ORGANIZATION_TREE_TEST_IDS } from './organization-tree';
import { PROFILE_TEST_IDS } from './profile';
import { PAGE_BREADCRUMB_TEST_IDS } from './page-breadcrumb';

export const TEST_IDS = {
  auth: AUTH_TEST_IDS,
  common: COMMON_TEST_IDS,
  dashboard: DASHBOARD_TEST_IDS,
  admin: ADMIN_TEST_IDS,
  table: TABLE_TEST_IDS,
  pages: PAGES_TEST_IDS,
  shared: SHARED_TEST_IDS,
  about: ABOUT_TEST_IDS,
  homeCards: HOME_CARDS_TEST_IDS,
  company: COMPANY_TEST_IDS,
  settings: SETTINGS_TEST_IDS,
  fileExplorer: FILE_EXPLORER_TEST_IDS,
  organizationTree: ORGANIZATION_TREE_TEST_IDS,
  profile: PROFILE_TEST_IDS,
  pageBreadcrumb: PAGE_BREADCRUMB_TEST_IDS,
} as const;
