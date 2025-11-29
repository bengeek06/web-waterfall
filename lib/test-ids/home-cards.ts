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
 * Test IDs for HomeCards component
 * Used for E2E testing with Playwright/Selenium
 */

export const HOME_CARDS_TEST_IDS = {
  container: 'home-cards-container',
  // Administration card
  administrationCard: 'home-card-administration',
  administrationButton: 'home-card-administration-button',
  // Company/Settings card
  companyCard: 'home-card-company',
  companyButton: 'home-card-company-button',
  // Projects card
  projectsCard: 'home-card-projects',
  projectsButton: 'home-card-projects-button',
  // Workspace card
  workspaceCard: 'home-card-workspace',
  workspaceButton: 'home-card-workspace-button',
} as const;

// Type exports
export type HomeCardsTestIds = typeof HOME_CARDS_TEST_IDS;
