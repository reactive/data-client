/* global require, module, __dirname */
process.env.ANANSI_JEST_BABELCONFIG = 'babel.config.js';
process.env.ANANSI_JEST_TSCONFIG = 'tsconfig.test.json';

const fs = require('fs');
const path = require('path');

const rnPreset = require('@react-native/jest-preset');

// ESM-only dependencies tests import; Jest must compile them to CommonJS
const esmModules = 'temporal-polyfill|temporal-utils';

const baseConfig = {
  transformIgnorePatterns: [
    `/node_modules/(?!@babel/runtime|${esmModules})`,
    '\\.pnp\\.[^\\/]+$',
  ],
  testEnvironmentOptions: {
    globalsCleanup: 'on',
    url: 'http://localhost',
  },
  preset: '@anansi/jest-preset',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'cts',
    'mts',
    'mtsx',
    'js',
    'jsx',
    'mjs',
    'cjs',
    'json',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    '/__tests__',
    'DevtoolsManager',
    'packages/vue/src/test',
    'packages/test',
    'packages/graphql',
    // dev-time migration tooling, not part of the runtime library
    'packages/codemods',
    'packages/rest/src/next',
    'packages/core/src/next',
    'packages/core/src/mock',
    'packages/react/src/next',
    'packages/react/src/server',
    'packages/react/src/components/DevToolsButton.tsx',
    // website code is tested but not published, so it isn't tracked
    '<rootDir>/website/',
  ],
  /** TODO: Remove once we move to 'publishConfig' */
  moduleNameMapper: {
    '^__tests__/(.*)$': '<rootDir>/__tests__/$1',
    '@data-client/react/redux$': ['<rootDir>/packages/react/src/server/redux'],
    '@data-client/([^/]+)(/.*|[^/]*)$': ['<rootDir>/packages/$1/src$2'],
  },
};

const packages = [
  'endpoint',
  'rest',
  'graphql',
  'core',
  'react',
  'vue',
  'normalizr',
  'use-enhanced-reducer',
  'img',
  'codemods',
  'test',
];

// CircleCI persist_to_workspace omits most of website/; only include these
// roots when the tree is present (full checkout / when CI persists them).
const websiteRoots = [
  'website/src/components/Playground',
  'website/src/components/motion',
];
const reactDomRoots = [
  ...packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
  ...websiteRoots
    .filter(root => fs.existsSync(path.join(__dirname, root)))
    .map(root => `<rootDir>/${root}`),
];

const projects = [
  {
    ...baseConfig,
    rootDir: __dirname,
    roots: reactDomRoots,
    displayName: 'ReactDOM',
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      // Docusaurus modules the website's tested components import
      '^@docusaurus/Translate$':
        '<rootDir>/website/src/components/Playground/testing/docusaurusTranslate.tsx',
      '^@docusaurus/theme-common$':
        '<rootDir>/website/src/components/Playground/testing/docusaurusThemeCommon.ts',
      '^@docusaurus/theme-common/internal$':
        '<rootDir>/website/src/components/Playground/testing/docusaurusThemeCommonInternal.ts',
      '^@docusaurus/BrowserOnly$':
        '<rootDir>/website/src/components/Playground/testing/docusaurusBrowserOnly.tsx',
      '^@docusaurus/useIsBrowser$':
        '<rootDir>/website/src/components/Playground/testing/docusaurusUseIsBrowser.ts',
      '^@theme/CodeBlock$':
        '<rootDir>/website/src/components/Playground/testing/themeCodeBlock.tsx',
    },
    setupFiles: ['<rootDir>/scripts/testSetup.js'],
    testEnvironment: 'jsdom',
    testRegex: [
      '((/__tests__/(?!.*\\.(node|native)).*)|(\\.|/)(test|spec))\\.(j|t)sx?$',
    ],
  },
  {
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'Node',
    setupFiles: ['<rootDir>/scripts/testSetupNode.js'],
    testEnvironment: 'node',
    transform: {
      ...baseConfig.transform,
      '^.+\\.(j)sx?$': [
        'babel-jest',
        { rootMode: 'upward', targets: { node: 'current' } },
      ],
    },
    transformIgnorePatterns: [
      ...baseConfig.transformIgnorePatterns,
      '<rootDir>/.*__tests__/[^/]+\\.(web|native)\\.(j|t)sx?$',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.node\\.(j|t)sx?$',
  },
  {
    // Layers @react-native/jest-preset on @anansi/jest-preset (jest takes one preset)
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'ReactNative',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.native\\.(j|t)sx?$',
    resolver: rnPreset.resolver,
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      // aliases react-native's `exports`-only entry points, which its resolver strips
      ...rnPreset.moduleNameMapper,
    },
    testEnvironment: rnPreset.testEnvironment,
    transformIgnorePatterns: [
      `node_modules\\/(?!(((jest-)?react-native)|@react-native(-community)?|@react-navigation|${esmModules}))`,
      '<rootDir>/.*__tests__/[^/]+\\.(web|node)\\.(j|t)sx?$',
      '<rootDir>/scripts',
    ],
    setupFiles: [
      ...rnPreset.setupFiles,
      '<rootDir>/scripts/testSetupNative.js',
    ],
    transform: {
      ...baseConfig.transform,
      '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
        require.resolve('@react-native/jest-preset/jest/assetFileTransformer.js'),
    },
    haste: rnPreset.haste,
  },
];

module.exports = {
  projects,
};
