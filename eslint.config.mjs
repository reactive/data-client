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
      // Playground snippet sources loaded via raw-loader; globals come from Monaco scope
      'website/src/components/Demo/code/**',
      // Monaco editor ambient stubs (not application source)
      'website/src/components/Playground/editor-types/**',
    ],
  },
  {
    files: ['**/*.?(m|c)ts?(x)'],
    rules: {
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },
  {
    // An overload implementation signature is not visible to callers, so `any`
    // there only disables checking the overloads against the body.
    // Use the real container type with `unknown` inner values instead.
    files: ['packages/*/src/**/*.?(m|c)ts?(x)'],
    // TODO: drop once #4114 and #4125 type the Vue composables
    ignores: ['packages/vue/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...[
          'TSDeclareFunction + FunctionDeclaration',
          'ExportNamedDeclaration:has(> TSDeclareFunction) + ExportNamedDeclaration > FunctionDeclaration',
          'ExportDefaultDeclaration:has(> TSDeclareFunction) + ExportDefaultDeclaration > FunctionDeclaration',
        ].map(impl => ({
          selector: `${impl} > TSTypeAnnotation :matches(TSAnyKeyword, TSTypeReference[typeName.name='Promise'] > TSTypeParameterInstantiation > TSAnyKeyword)`,
          message:
            'Overload implementation signatures must not return `any`; it hides mismatches between the overloads and the body. Use the real return type (with `unknown` inner values).',
        })),
      ],
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
