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
 * Test IDs for authentication components
 * Used for E2E testing with Playwright/Selenium
 */

export const AUTH_TEST_IDS = {
  login: {
    form: 'login-form',
    card: 'login-card',
    title: 'login-title',
    emailInput: 'login-email-input',
    emailIcon: 'login-email-icon',
    passwordInput: 'login-password-input',
    passwordIcon: 'login-password-icon',
    submitButton: 'login-submit-button',
    registerButton: 'login-register-button',
    errorMessage: 'login-error-message',
  },
  register: {
    form: 'register-form',
    card: 'register-card',
    title: 'register-title',
    emailInput: 'register-email-input',
    passwordInput: 'register-password-input',
    confirmPasswordInput: 'register-confirm-password-input',
    submitButton: 'register-submit-button',
    loginButton: 'register-login-button',
    errorMessage: 'register-error-message',
  },
  initApp: {
    form: 'init-app-form',
    card: 'init-app-card',
    logo: 'init-app-logo',
    title: 'init-app-title',
    companyCard: 'init-app-company-card',
    companyIcon: 'init-app-company-icon',
    companyInput: 'init-app-company-input',
    companyError: 'init-app-company-error',
    userCard: 'init-app-user-card',
    userIcon: 'init-app-user-icon',
    userNameInput: 'init-app-username-input',
    userError: 'init-app-user-error',
    passwordIcon: 'init-app-password-icon',
    passwordInput: 'init-app-password-input',
    passwordError: 'init-app-password-error',
    confirmPasswordIcon: 'init-app-confirm-password-icon',
    confirmPasswordInput: 'init-app-confirm-password-input',
    confirmPasswordError: 'init-app-confirm-password-error',
    submitButton: 'init-app-submit-button',
    passwordMismatchError: 'init-app-password-mismatch-error',
    errorMessage: 'init-app-error-message',
    successMessage: 'init-app-success-message',
  },
} as const;

/**
 * Helper function to generate data-testid attribute
 * @param id - The test ID string
 * @returns Object with data-testid attribute
 * 
 * @example
 * <Input {...testId(AUTH_TEST_IDS.login.emailInput)} />
 */
export const testId = (id: string) => ({
  'data-testid': id,
});

// Type exports for TypeScript autocomplete
export type AuthTestIds = typeof AUTH_TEST_IDS;
export type LoginTestIds = typeof AUTH_TEST_IDS.login;
export type RegisterTestIds = typeof AUTH_TEST_IDS.register;
export type InitAppTestIds = typeof AUTH_TEST_IDS.initApp;
