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
 * Test IDs for Profile modal component
 * Used for E2E testing with Playwright/Selenium
 */

export const PROFILE_TEST_IDS = {
  trigger: 'profile-modal-trigger',
  dialog: 'profile-modal-dialog',
  title: 'profile-modal-title',
  avatarContainer: 'profile-avatar-container',
  avatarPreview: 'profile-avatar-preview',
  avatarCameraButton: 'profile-avatar-camera-button',
  avatarUploadButton: 'profile-avatar-upload-button',
  avatarFileInput: 'profile-avatar-file-input',
  avatarHint: 'profile-avatar-hint',
  firstNameLabel: 'profile-first-name-label',
  firstNameInput: 'profile-first-name-input',
  lastNameLabel: 'profile-last-name-label',
  lastNameInput: 'profile-last-name-input',
  emailLabel: 'profile-email-label',
  emailInput: 'profile-email-input',
  phoneLabel: 'profile-phone-label',
  phoneInput: 'profile-phone-input',
  languageLabel: 'profile-language-label',
  languageSelect: 'profile-language-select',
  cancelButton: 'profile-cancel-button',
  saveButton: 'profile-save-button',
} as const;

// Type exports
export type ProfileTestIds = typeof PROFILE_TEST_IDS;
