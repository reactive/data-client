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
  roots: ['<rootDir>/src'],
  transform: {
    //'^.+\\.tsx?$': 'ts-jest',
    '^.+\\.(t|j)sx?$': '<rootDir>/../../scripts/babel-jest',
  },
  globals: {
    'ts-jest': {
      babelConfig: 'babel.config.js',
      tsConfig: '<rootDir>/tsconfig.json',
    },
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
  coveragePathIgnorePatterns: [
    'node_modules',
    'react-integration/hooks/useSelection',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      readTsConfig('./', 'tsconfig-base.json').options.paths,
      {
        prefix: '<rootDir>/../../',
      },
    ),
  },
  setupFiles: ['<rootDir>/../../scripts/testSetup.js'],
};

const packages = ['legacy', 'rest-hooks', 'normalizr'];

const projects = packages.map(pkgName => ({
  ...baseConfig,
  rootDir: __dirname + `/packages/${pkgName}`,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      readTsConfig(`./packages/${pkgName}/`).options.paths,
      {
        prefix: '<rootDir>/../../',
      },
    ),
  },
}));

module.exports = {
  projects,
};
