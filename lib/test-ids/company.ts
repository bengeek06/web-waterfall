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
 * Test IDs for Company page component
 * Used for E2E and integration testing
 */
export const COMPANY_TEST_IDS = {
  // Container
  card: 'company-card',
  
  // Navigation
  backButton: 'company-back-button',
  backButtonHeader: 'company-back-button-header',
  
  // Form fields
  nameInput: 'company-name-input',
  addressInput: 'company-address-input',
  cityInput: 'company-city-input',
  postalCodeInput: 'company-postal-code-input',
  countryInput: 'company-country-input',
  phoneInput: 'company-phone-input',
  emailInput: 'company-email-input',
  websiteInput: 'company-website-input',
  siretInput: 'company-siret-input',
  vatNumberInput: 'company-vat-number-input',
  
  // Action buttons
  editButton: 'company-edit-button',
  cancelButton: 'company-cancel-button',
  saveButton: 'company-save-button',
  
  // Messages
  successMessage: 'company-success-message',
  errorMessage: 'company-error-message',
  
  // Dialog
  unsavedChangesDialog: 'company-unsaved-changes-dialog',
  keepEditingButton: 'company-keep-editing-button',
  discardChangesButton: 'company-discard-changes-button',
} as const;
