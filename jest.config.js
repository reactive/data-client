process.env.ANANSI_JEST_BABELCONFIG = 'babel.config.js';
process.env.ANANSI_JEST_TSCONFIG = 'tsconfig.test.json';

const baseConfig = {
  testEnvironmentOptions: {
    globalsCleanup: 'on',
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
    'packages/test',
    'packages/graphql',
    'packages/rest/src/next',
    'packages/core/src/next',
    'packages/react/src/next',
    'packages/react/src/server',
    'packages/react/src/components/DevToolsButton.tsx',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  /** TODO: Remove once we move to 'publishConfig' */
  moduleNameMapper: {
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
    // RN preset at https://github.com/facebook/react-native/blob/main/packages/react-native/jest-preset.js
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'ReactNative',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.native\\.(j|t)sx?$',
    testEnvironment: require.resolve('react-native/jest/react-native-env.js'),
    transformIgnorePatterns: [
      'node_modules\\/(?!(((jest-)?react-native)|@react-native(-community)?|@react-navigation))', //from RN preset
      '<rootDir>/.*__tests__/[^/]+\\.(web|node)\\.(j|t)sx?$',
      '<rootDir>/scripts',
    ],
    setupFiles: [
      require.resolve('react-native/jest/setup.js'), //from RN preset
      '<rootDir>/scripts/testSetupNative.js',
    ],
    transform: {
      //'^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js', //setup.js needs to be transformed, but preprocessor screws everything else up
      ...baseConfig.transform,
      '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
        'react-native/jest/assetFileTransformer.js',
      ), //from RN preset
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
