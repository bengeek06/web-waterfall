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
 * Test IDs for Admin pages and components
 */

export const ADMIN_TEST_IDS = {
  users: {
    // Page
    page: 'admin-users-page',
    title: 'admin-users-title',
    createButton: 'admin-users-create-button',
    
    // Table
    table: 'admin-users-table',
    tableRow: (id: string) => `admin-users-table-row-${id}`,
    editButton: (id: string) => `admin-users-edit-button-${id}`,
    deleteButton: (id: string) => `admin-users-delete-button-${id}`,
    
    // Create/Edit Modal
    modal: 'admin-users-modal',
    modalTitle: 'admin-users-modal-title',
    emailInput: 'admin-users-email-input',
    passwordInput: 'admin-users-password-input',
    firstNameInput: 'admin-users-first-name-input',
    lastNameInput: 'admin-users-last-name-input',
    phoneInput: 'admin-users-phone-input',
    avatarUrlInput: 'admin-users-avatar-url-input',
    languageSelect: 'admin-users-language-select',
    rolesDropdown: 'admin-users-roles-dropdown',
    positionSelect: 'admin-users-position-select',
    isActiveSwitch: 'admin-users-is-active-switch',
    isVerifiedSwitch: 'admin-users-is-verified-switch',
    cancelButton: 'admin-users-cancel-button',
    submitButton: 'admin-users-submit-button',
    formError: 'admin-users-form-error',
    
    // Delete Modal
    deleteModal: 'admin-users-delete-modal',
    deleteModalTitle: 'admin-users-delete-modal-title',
    deleteCancelButton: 'admin-users-delete-cancel-button',
    deleteConfirmButton: 'admin-users-delete-confirm-button',
  },
  
  roles: {
    // Page
    page: 'admin-roles-page',
    title: 'admin-roles-title',
  },
} as const;

