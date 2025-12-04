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
 * Test IDs for Settings components
 * Used for E2E testing with Playwright/Selenium
 */

export const SETTINGS_TEST_IDS = {
  cards: {
    container: 'settings-cards-container',
    // Company Info card
    companyCard: 'settings-card-company',
    companyButton: 'settings-card-company-button',
    // Organization Structure card
    organizationCard: 'settings-card-organization',
    organizationButton: 'settings-card-organization-button',
    // Customers card
    customersCard: 'settings-card-customers',
    customersButton: 'settings-card-customers-button',
    // Subcontractors card
    subcontractorsCard: 'settings-card-subcontractors',
    subcontractorsButton: 'settings-card-subcontractors-button',
  },
} as const;

// Type exports
export type SettingsTestIds = typeof SETTINGS_TEST_IDS;
