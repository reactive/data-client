const { pathsToModuleNameMapper } = require('ts-jest/utils');
const ts = require('typescript');

function readTsConfig(path = './', configName = 'tsconfig.json') {
  const parseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true,
  };

  const configFileName = ts.findConfigFile(path, ts.sys.fileExists, configName);
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    parseConfigHost,
    path,
  );
  return compilerOptions;
}

const baseConfig = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.(j)sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  globals: {
    'ts-jest': {
      babelConfig: 'babel.config.js',
      tsConfig: '<rootDir>/tsconfig.test.json',
    },
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
  coveragePathIgnorePatterns: [
    'node_modules',
    'react-integration/hooks/useSelection',
    'packages/test',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      readTsConfig('./', 'tsconfig.test.json').options.paths,
      {
        prefix: '<rootDir>/',
      },
    ),
  },
  testURL: 'http://localhost',
};

const packages = [
  'legacy',
  'endpoint',
  'rest',
  'core',
  'rest-hooks',
  'normalizr',
  'use-enhanced-reducer',
  'hooks',
  'img',
];

const projects = [
  {
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
    displayName: 'ReactDOM',
    setupFiles: ['<rootDir>/scripts/testSetup.js'],
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
    transformIgnorePatterns: ['<rootDir>/.*__tests__/[^/]+\\.web\\.(j|t)sx?$'],
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
