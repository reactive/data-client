process.env.ANANSI_JEST_BABELCONFIG = 'babel.config.js';
process.env.ANANSI_JEST_TSCONFIG = 'tsconfig.test.json';

const baseConfig = {
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
    'packages/test',
    'packages/graphql',
    'packages/redux',
    'packages/ssr',
    'packages/rest/src/next',
    'packages/core/src/next',
    'packages/react/src/next',
    'packages/legacy/src/resource',
    'packages/legacy/src/rest-3',
    'packages/rest-hooks/src/hooks/hasUsableData',
    'packages/core/src/state/legacy-actions/createFetch',
    'packages/react/src/makeCacheProvider',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  /** TODO: Remove once we move to 'publishConfig' */
  moduleNameMapper: {
    '@rest-hooks/redux/makeCacheProvider$': [
      '<rootDir>/packages/redux/src/makeExternalCacheProvider',
    ],
    '@rest-hooks/([^/]+)(/.*|[^/]*)$': ['<rootDir>/packages/$1/src$2'],
    'rest-hooks': ['<rootDir>/packages/rest-hooks/src'],
  },
};

const packages = [
  'legacy',
  'endpoint',
  'rest',
  'graphql',
  'core',
  'react',
  'redux',
  'rest-hooks',
  'normalizr',
  'use-enhanced-reducer',
  'hooks',
  'img',
  'test',
];

const projects = [
  {
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'ReactDOM',
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
      '/node_modules/(?!@babel/runtime)',
      '\\.pnp\\.[^\\/]+$',
      '<rootDir>/.*__tests__/[^/]+\\.(web|native)\\.(j|t)sx?$',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.node\\.(j|t)sx?$',
  },
  {
    // RN preset at https://github.com/facebook/react-native/blob/main/jest-preset.js
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'React Native',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.native\\.(j|t)sx?$',
    testEnvironment: 'node',
    //'<rootDir>/node_modules/react-native/jest/react-native-env.js', //from RN preset future version
    transformIgnorePatterns: [
      'node_modules\\/(?!(((jest-)?react-native)|@react-native(-community)?|react-navigation))', //from RN preset
      '<rootDir>/.*__tests__/[^/]+\\.(web|node)\\.(j|t)sx?$',
      '<rootDir>/scripts',
    ],
    setupFiles: [
      '<rootDir>/node_modules/react-native/jest/setup.js', //from RN preset
      '<rootDir>/scripts/testSetupNative.js',
    ],
    transform: {
      //'^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js', //setup.js needs to be transformed, but preprocessor screws everything else up
      ...baseConfig.transform,
      '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
        '<rootDir>/node_modules/react-native/jest/assetFileTransformer.js', //from RN preset
    },
    haste: {
      //from RN preset
      defaultPlatform: 'ios',
      platforms: ['android', 'ios', 'native'],
    },
  },
];

module.exports = {
  projects,
};
