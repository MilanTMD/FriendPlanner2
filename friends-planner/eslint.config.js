import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/** Calendar dates are strings. Only shared/dates.ts may touch Date (BRIEF section 5.4). */
const dateRestrictions = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "NewExpression[callee.name='Date']",
      message: 'Do not construct Date objects for calendar logic. Use shared/dates.ts (todayLocal, addDays, ...).',
    },
  ],
  'no-restricted-properties': [
    'error',
    { object: 'Date', property: 'parse', message: 'Date.parse shifts calendar dates by time zone. Use shared/dates.ts.' },
    { property: 'getDate', message: 'Local getters are banned outside shared/dates.ts.' },
    { property: 'getMonth', message: 'Local getters are banned outside shared/dates.ts.' },
    { property: 'getFullYear', message: 'Local getters are banned outside shared/dates.ts.' },
    { property: 'getDay', message: 'Local getters are banned outside shared/dates.ts.' },
    { property: 'toISOString', message: 'toISOString converts to UTC and shifts dates. Use shared/dates.ts.' },
  ],
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.netlify/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023 },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
  },

  // Browser app
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...dateRestrictions,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: ['src/**/*.tsx'],
    ...reactRefresh.configs.vite(),
  },
  {
    // Context modules intentionally export a provider component and its hook together.
    files: ['src/state/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Shared code (browser + server): same date rules, except shared/dates.ts itself.
  {
    files: ['shared/**/*.ts'],
    ignores: ['shared/dates.ts'],
    rules: dateRestrictions,
  },

  // Server, scripts and tool configs (Node)
  {
    files: ['netlify/**/*.ts', 'scripts/**/*.ts', '*.config.{js,ts}', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // Tests (written by QA)
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
