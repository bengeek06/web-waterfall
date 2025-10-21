/**
 * Test IDs for dashboard and admin components
 * Used for E2E testing with Playwright/Selenium
 */

export const DASHBOARD_TEST_IDS = {
  users: {
    table: 'users-table',
    tableHeader: 'users-table-header',
    tableRow: (userId: string) => `users-table-row-${userId}`,
    addButton: 'users-add-button',
    searchInput: 'users-search-input',
    filterDropdown: 'users-filter-dropdown',
    editButton: (userId: string) => `users-edit-button-${userId}`,
    deleteButton: (userId: string) => `users-delete-button-${userId}`,
  },
  roles: {
    table: 'roles-table',
    tableRow: (roleId: string) => `roles-table-row-${roleId}`,
    addButton: 'roles-add-button',
    searchInput: 'roles-search-input',
    editButton: (roleId: string) => `roles-edit-button-${roleId}`,
    deleteButton: (roleId: string) => `roles-delete-button-${roleId}`,
  },
  policies: {
    table: 'policies-table',
    tableRow: (policyId: string) => `policies-table-row-${policyId}`,
    addButton: 'policies-add-button',
    manageButton: (policyId: string) => `policies-manage-button-${policyId}`,
  },
  profile: {
    form: 'profile-form',
    nameInput: 'profile-name-input',
    emailInput: 'profile-email-input',
    companyInput: 'profile-company-input',
    saveButton: 'profile-save-button',
    cancelButton: 'profile-cancel-button',
    changePasswordButton: 'profile-change-password-button',
  },
} as const;

// Type exports
export type DashboardTestIds = typeof DASHBOARD_TEST_IDS;
