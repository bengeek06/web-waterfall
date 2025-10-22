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
    section: 'roles-section',
    title: 'roles-title',
    table: 'roles-table',
    tableHeader: 'roles-table-header',
    tableRow: (roleId: string) => `roles-table-row-${roleId}`,
    expandButton: (roleId: string) => `roles-expand-button-${roleId}`,
    addButton: 'roles-add-button',
    searchInput: 'roles-search-input',
    editButton: (roleId: string) => `roles-edit-button-${roleId}`,
    deleteButton: (roleId: string) => `roles-delete-button-${roleId}`,
    addPolicyButton: (roleId: string) => `roles-add-policy-button-${roleId}`,
    
    // Role Dialog
    dialog: 'role-dialog',
    dialogTitle: 'role-dialog-title',
    nameInput: 'role-name-input',
    descriptionInput: 'role-description-input',
    cancelButton: 'role-cancel-button',
    submitButton: 'role-submit-button',
    
    // Policies Section (expanded)
    policiesSection: (roleId: string) => `role-policies-section-${roleId}`,
    policyItem: (roleId: string, policyId: string) => `role-policy-item-${roleId}-${policyId}`,
    removePolicyButton: (roleId: string, policyId: string) => `role-remove-policy-button-${roleId}-${policyId}`,
    
    // Add Policy Dialog
    addPolicyDialog: 'add-policy-dialog',
    addPolicyDialogTitle: 'add-policy-dialog-title',
    policyCheckbox: (policyId: string) => `policy-checkbox-${policyId}`,
    addPolicyCancelButton: 'add-policy-cancel-button',
    addPolicySubmitButton: 'add-policy-submit-button',
    
    // Error Message
    errorMessage: 'roles-error-message',
  },
  policies: {
    section: 'policies-section',
    title: 'policies-title',
    table: 'policies-table',
    tableHeader: 'policies-table-header',
    tableRow: (policyId: string) => `policies-table-row-${policyId}`,
    expandButton: (policyId: string) => `policies-expand-button-${policyId}`,
    addButton: 'policies-add-button',
    editButton: (policyId: string) => `policies-edit-button-${policyId}`,
    deleteButton: (policyId: string) => `policies-delete-button-${policyId}`,
    addPermissionButton: (policyId: string) => `policies-add-permission-button-${policyId}`,
    
    // Policy Dialog
    dialog: 'policy-dialog',
    dialogTitle: 'policy-dialog-title',
    nameInput: 'policy-name-input',
    descriptionInput: 'policy-description-input',
    cancelButton: 'policy-cancel-button',
    submitButton: 'policy-submit-button',
    
    // Permission Group
    permissionGroup: (service: string, resource: string) => `permission-group-${service}-${resource}`,
    permissionIcon: (permissionId: string | number) => `permission-icon-${permissionId}`,
    editPermissionGroupButton: (service: string, resource: string) => `edit-permission-group-${service}-${resource}`,
    deletePermissionGroupButton: (service: string, resource: string) => `delete-permission-group-${service}-${resource}`,
    
    // Add Permission Dialog
    addPermissionDialog: 'add-permission-dialog',
    addPermissionDialogTitle: 'add-permission-dialog-title',
    serviceFilter: 'permission-service-filter',
    resourceFilter: 'permission-resource-filter',
    permissionCheckbox: (permissionId: string | number) => `permission-checkbox-${permissionId}`,
    addPermissionCancelButton: 'add-permission-cancel-button',
    addPermissionSubmitButton: 'add-permission-submit-button',
    
    // Error Message
    errorMessage: 'policies-error-message',
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
