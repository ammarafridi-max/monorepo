import js from '@eslint/js';

export default [
  {
    ignores: ['**/.next/**', '**/out/**', '**/build/**', '**/node_modules/**', '**/public/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    rules: {
      // Browser and Node globals are not declared here (the `globals` package is not installed),
      // so no-undef would fire on window, process and friends.
      'no-undef': 'off',
      // Warn, not error: the apps carry a backlog of unused imports and a red lint blocks everything else.
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
