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
 * Test IDs for About modal component
 * Used for E2E testing with Playwright/Selenium
 */

export const ABOUT_TEST_IDS = {
  trigger: 'about-modal-trigger',
  dialog: 'about-modal-dialog',
  title: 'about-modal-title',
  applicationSection: 'about-application-section',
  webVersion: 'about-web-version',
  webVersionStatus: 'about-web-version-status',
  servicesSection: 'about-services-section',
  serviceItem: (serviceName: string) => `about-service-${serviceName.toLowerCase().replace(/\s+/g, '-')}`,
  serviceStatus: (serviceName: string) => `about-service-status-${serviceName.toLowerCase().replace(/\s+/g, '-')}`,
  footer: 'about-modal-footer',
} as const;

// Type exports
export type AboutTestIds = typeof ABOUT_TEST_IDS;
