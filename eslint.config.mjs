import anansiPlugin from '@anansi/eslint-plugin';
import globals from 'globals';

export default [
  ...anansiPlugin.configs.typescript,
  {
    ignores: [
      '**/lib*/*',
      '**/dist*/*',
      'packages/*/native/*',
      '**/node_modules*/*',
      'node_modules/*',
      '**/src-*-types/*',
    ],
  },
  {
    files: ['**/*.?(m|c)ts?(x)'],
    rules: {
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },
  {
    files: ['**/__tests__/**/*.?(m|c)ts?(x)', '**/*.test?(.*).?(m|c)ts?(x)'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/*.?(m|c)js?(x)'],
    settings: {
      'import/resolver': {
        node: {},
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'writable',
      },
    },
  },
  {
    files: ['examples/**/*.?(m|c)ts?(x)'],
    rules: {
      'no-console': 'off',
    },
  },
  // Disable React-specific rules for Vue package
  {
    files: ['packages/vue/**/*.?(m|c)ts?(x)', 'packages/vue/**/*.?(m|c)js?(x)'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
];
