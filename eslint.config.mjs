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
      "components/ui/**",
    ],
  },
  {
    // Global configuration for all files
    languageOptions: {
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        // TypeScript/Web API types
        RequestInfo: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        Headers: "readonly",
        Request: "readonly",
        HTMLInputElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLFormElement: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        // Node.js globals (for config files)
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      // Allow unused vars with underscore prefix
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Turn off no-undef for TypeScript files (TypeScript handles this)
      "no-undef": "off",
      // Allow React hooks setState in effects with proper dependencies
      "react-hooks/exhaustive-deps": "warn",
      // Restrict usage of native browser dialogs (use AlertDialog and toast instead)
      "no-restricted-globals": ["error", 
        {
          "name": "alert",
          "message": "Use toast notifications from sonner instead of alert()"
        },
        {
          "name": "confirm",
          "message": "Use AlertDialog component from @/components/ui/alert-dialog instead of confirm()"
        },
        {
          "name": "prompt",
          "message": "Use Dialog component with Input from @/components/ui/dialog instead of prompt()"
        }
      ],
    },
  },
  {
    // Test files configuration
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
    rules: {
      // Relax rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // TypeScript declaration files
    files: ["**/*.d.ts"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    // Jest config files
    files: ["**/jest.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
