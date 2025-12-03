import '@testing-library/jest-dom'

// Mock next/navigation for all tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
    keys: jest.fn(() => []),
    values: jest.fn(() => []),
    entries: jest.fn(() => []),
    forEach: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/test-path',
  useParams: () => ({}),
}));

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