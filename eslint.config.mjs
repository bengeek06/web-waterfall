import js from '@eslint/js';
import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  js.configs.recommended,
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/__tests__/**/*", "**/jest.config.js", "**/jest.setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
];

export default eslintConfig;
