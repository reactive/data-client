process.env.ANANSI_JEST_BABELCONFIG = 'babel.config.js';
process.env.ANANSI_JEST_TSCONFIG = 'tsconfig.test.json';

const baseConfig = {
  preset: '@anansi/jest-preset',
  coveragePathIgnorePatterns: [
    'node_modules',
    '/__tests__',
    'react-integration/hooks/useSelection',
    'packages/test',
    'packages/experimental',
    'packages/graphql',
    'packages/ssr',
    'packages/legacy/src/resource',
    'packages/legacy/src/rest-3',
    'packages/core/src/react-integration/hooks/hasUsableData',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  /** TODO: Remove once we move to 'publishConfig' */
  moduleNameMapper: {
    '@rest-hooks/(.*)$': ['<rootDir>/packages/$1/src'],
    'rest-hooks': ['<rootDir>/packages/rest-hooks/src'],
  },
};

const packages = [
  'legacy',
  'experimental',
  'endpoint',
  'rest',
  'graphql',
  'core',
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
      '((/__tests__/(?!.*\\.node).*)|(\\.|/)(test|spec))\\.(j|t)sx?$',
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
      '<rootDir>/.*__tests__/[^/]+\\.web\\.(j|t)sx?$',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.node\\.(j|t)sx?$',
  },
  /*{
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'React Native',
    preset: 'react-native',
    transformIgnorePatterns: [
      '/node_modules/(?!(jest-)?react-native|@react-native-community)', //from RN preset
      '<rootDir>/.*__tests__/[^/]+\\.web\\.(j|t)sx?$',
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
  },*/
];

module.exports = {
  projects,
};
