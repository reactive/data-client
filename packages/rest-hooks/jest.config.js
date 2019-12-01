const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  roots: ['<rootDir>/src'],
  /**
   *  If you comment this out, you will get error unexpected token with optional chaining because you are using babel in your project
   *  When using babel together with ts-jest in a project, you need to let ts-jest know about it
   */
  globals: {
    'ts-jest': {
      babelConfig: 'src/.babelrc',
      tsConfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  coveragePathIgnorePatterns: ['node_modules', 'react-integration/hooks/useSelection'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }),
    '^rest-hooks$': '<rootDir>/src/index.ts',
  },
  setupFiles: ['../../scripts/testSetup.js'],
};
