import anansiPlugin from '@anansi/eslint-plugin';
import globals from 'globals';

// Playground/preview/ is the lazy PreviewWithScope chunk (live execution,
// Store inspector). A static import from outside copies it into every docs page
// with a Playground, so only these eager files (SSR and loading-state chrome)
// may be imported.
const EAGER_PREVIEW = ['FixturePreview', 'PreviewWrapper', 'StoreToggle'];
/** Restrict `restricted` import paths, except the eager files */
const lazyPreviewImports = (...restricted) => [
  'error',
  {
    patterns: [
      {
        group: [
          ...restricted,
          // gitignore-style `X` does not match `X.tsx`
          ...EAGER_PREVIEW.flatMap(f =>
            ['./', '**/preview/'].flatMap(dir => [
              `!${dir}${f}`,
              `!${dir}${f}.*`,
            ]),
          ),
        ],
        allowTypeImports: true,
        message:
          'Playground/preview/ loads lazily: use import() or `import type`, or add a deliberately eager file to EAGER_PREVIEW in eslint.config.mjs.',
      },
    ],
  },
];

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
    // Published declarations are emitted from these sources (tests follow the same style).
    // An overload implementation signature is not visible to callers, so `any`
    // there only disables checking the overloads against the body.
    // Use the real container type with `unknown` inner values instead.
    files: ['packages/*/src/**/*.?(m|c)ts?(x)'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(TSDeclareFunction + FunctionDeclaration, ExportNamedDeclaration:has(> TSDeclareFunction) + ExportNamedDeclaration > FunctionDeclaration, ExportDefaultDeclaration:has(> TSDeclareFunction) + ExportDefaultDeclaration > FunctionDeclaration, MethodDefinition:has(> TSEmptyBodyFunctionExpression) + MethodDefinition > FunctionExpression) > TSTypeAnnotation TSAnyKeyword',
          message:
            'Overload implementation signatures must not return `any`; it hides mismatches between the overloads and the body. Use the real return type (with `unknown` inner values).',
        },
        {
          selector: 'ExportSpecifier[exportKind="type"]',
          message:
            'Inline `type` export specifiers are emitted into .d.ts files, which TypeScript < 4.5 cannot parse. Use a separate `export type { ... }`.',
        },
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
  },
  {
    files: ['website/src/**/*.?(m|c)ts?(x)'],
    ignores: ['website/src/components/Playground/preview/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports':
        lazyPreviewImports('**/preview/**'),
    },
  },
  {
    // The eager files themselves must not reach into the lazy rest of preview/
    files: EAGER_PREVIEW.map(
      f => `website/src/components/Playground/preview/${f}.?(m|c)ts?(x)`,
    ),
    rules: {
      '@typescript-eslint/no-restricted-imports': lazyPreviewImports(
        './**',
        '**/preview/**',
      ),
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
