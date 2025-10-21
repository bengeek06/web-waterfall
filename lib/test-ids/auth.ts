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
    companyInput: 'init-app-company-input',
    userNameInput: 'init-app-username-input',
    passwordInput: 'init-app-password-input',
    confirmPasswordInput: 'init-app-confirm-password-input',
    submitButton: 'init-app-submit-button',
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
