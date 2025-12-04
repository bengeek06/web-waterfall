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
 * Test IDs for shared components
 * Used for E2E testing with Playwright/Selenium
 */

// Helper function for creating test ID props
export const testId = (id: string) => ({ 'data-testid': id });

export const SHARED_TEST_IDS = {
  logoUpload: {
    container: 'logo-upload-container',
    dropZone: 'logo-upload-drop-zone',
    fileInput: 'logo-upload-file-input',
    uploadButton: 'logo-upload-button',
    removeButton: 'logo-upload-remove-button',
    preview: 'logo-upload-preview',
    previewImage: 'logo-upload-preview-image',
    loadingSpinner: 'logo-upload-loading-spinner',
    infoText: 'logo-upload-info-text',
  },
  authGuard: {
    verifyingContainer: 'auth-guard-verifying-container',
    verifyingSpinner: 'auth-guard-verifying-spinner',
    verifyingText: 'auth-guard-verifying-text',
    redirectingContainer: 'auth-guard-redirecting-container',
    redirectingText: 'auth-guard-redirecting-text',
  },
} as const;

// Type exports
export type SharedTestIds = typeof SHARED_TEST_IDS;
