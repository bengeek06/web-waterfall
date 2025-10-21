const nextJest = require('next/jest')

// Hint: ensure this is installed: npm i -D jest-environment-jsdom
try {
  require.resolve('jest-environment-jsdom')
} catch {
  console.warn(
    '[jest.config.js] Missing devDependency "jest-environment-jsdom". Install with: npm i -D jest-environment-jsdom'
  )
}

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Configuration explicite pour VS Code
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/e2e/'  // Exclure les tests Playwright
  ],
  // Optimisations pour Node.js 24
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  // Configuration pour VS Code Jest
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**'
  ],
  // Éviter les conflits avec npm
  passWithNoTests: true
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)