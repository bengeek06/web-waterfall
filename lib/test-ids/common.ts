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
 * Test IDs for common/shared components
 * Used for E2E testing with Playwright/Selenium
 */

export const COMMON_TEST_IDS = {
  topBar: {
    nav: 'topbar-nav',
    container: 'topbar-container',
    logo: 'topbar-logo',
    logoLink: 'topbar-logo-link',
    avatarButton: 'topbar-avatar-button',
    avatarImage: 'topbar-avatar-image',
    avatarIcon: 'topbar-avatar-icon',
    dropdownContent: 'topbar-dropdown-content',
    userMenu: 'topbar-user-menu',
    userAvatar: 'topbar-user-avatar',
    userName: 'topbar-user-name',
    logoutButton: 'topbar-logout-button',
    logoutLink: 'topbar-logout-link',
    profileLink: 'topbar-profile-link',
    aboutLink: 'topbar-about-link',
    settingsLink: 'topbar-settings-link',
  },
  navigation: {
    sidebar: 'nav-sidebar',
    homeLink: 'nav-home-link',
    projectsLink: 'nav-projects-link',
    usersLink: 'nav-users-link',
    rolesLink: 'nav-roles-link',
    companyLink: 'nav-company-link',
    profileLink: 'nav-profile-link',
  },
  ui: {
    loadingSpinner: 'ui-loading-spinner',
    errorAlert: 'ui-error-alert',
    successAlert: 'ui-success-alert',
    confirmDialog: 'ui-confirm-dialog',
    confirmDialogCancel: 'ui-confirm-dialog-cancel',
    confirmDialogConfirm: 'ui-confirm-dialog-confirm',
  },
} as const;

// Type exports
export type CommonTestIds = typeof COMMON_TEST_IDS;
