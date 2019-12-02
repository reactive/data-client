const { pathsToModuleNameMapper } = require('ts-jest/utils');
const ts = require('typescript');

function readTsConfig(path = "./") {
  const parseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true
  };

  const configFileName = ts.findConfigFile(
    path,
    ts.sys.fileExists,
    "tsconfig.json"
  );
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    parseConfigHost,
    path
  );
  return compilerOptions;
}

const { options } = readTsConfig();

module.exports = {
  roots: ['<rootDir>/src'],
  /**
   *  If you comment this out, you will get error unexpected token with optional chaining because you are using babel in your project
   *  When using babel together with ts-jest in a project, you need to let ts-jest know about it
   */
  globals: {
    // ts-jest is not very flexible in handling these properly, which is why we have to make a separate config
    // for each package
    'ts-jest': {
      babelConfig: require('../../babel.config')({cache:{using: () => {}}}),
      tsConfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': '<rootDir>/../../scripts/babel-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(options.paths, {
      prefix: '<rootDir>/../../',
    }),
  },
  setupFiles: ['../../scripts/testSetup.js'],
};
