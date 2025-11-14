import '@testing-library/jest-dom'

// Suppress console outputs during tests
// This includes act() warnings, expected error logs, and debug logs
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Suppress all console outputs during tests
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});