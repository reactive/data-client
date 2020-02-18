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
    '^.+\\.(j)sx?$': '<rootDir>/scripts/babel-jest',
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
  setupFiles: ['<rootDir>/scripts/testSetup.js'],
};

const packages = ['legacy', 'rest-hooks', 'normalizr'];

const projects = [
  {
    ...baseConfig,
    rootDir: __dirname,
    roots: packages.map(pkgName => `<rootDir>/packages/${pkgName}/src`),
  },
];

module.exports = {
  projects,
};
