const { pathsToModuleNameMapper } = require('ts-jest/utils');
const ts = require('typescript');

function readTsConfig(path = "./", configName = "tsconfig.json") {
  const parseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true
  };

  const configFileName = ts.findConfigFile(
    path,
    ts.sys.fileExists,
    configName
  );
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    parseConfigHost,
    path
  );
  return compilerOptions;
}

const { options } = readTsConfig('./', 'tsconfig-base.json');

const baseConfig = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': '<rootDir>/../../scripts/babel-jest',
  },
  globals: {
    'ts-jest': {
      babelConfig: 'babel.config.js',
      tsConfig: '<rootDir>/tsconfig.json',
    },
  },  
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
  coveragePathIgnorePatterns: ['node_modules', 'react-integration/hooks/useSelection'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(options.paths, {
      prefix: '<rootDir>/../../',
    }),
  },
  setupFiles: ['<rootDir>/../../scripts/testSetup.js'],
};

const projects = [
  {
    ...baseConfig,
    rootDir: __dirname + '/packages/rest-hooks',
    moduleNameMapper: {
      ...pathsToModuleNameMapper(readTsConfig('./packages/rest-hooks/').options.paths, {
        prefix: '<rootDir>/../../',
      }),
    },
  
  }
]

module.exports = {
  projects,
};
