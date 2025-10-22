/**
 * Centralized test IDs for E2E testing
 * Import from here to use test IDs across the application
 */

export * from './auth';
export * from './common';
export * from './dashboard';
export * from './admin';

// Re-export helper function
export { testId } from './auth';
