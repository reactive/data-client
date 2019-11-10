module.exports = {
  roots: ['<rootDir>/src'],
  /**
   *  If you comment this out, you will get error unexpected token with optional chaining because you are using babel in your project
   *  When using babel together with ts-jest in a project, you need to let ts-jest know about it
   */
  globals: {
    'ts-jest': {
      babelConfig: 'src/.babelrc',
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  coveragePathIgnorePatterns: ['test', 'react-integration/hooks/useSelection'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['./scripts/testSetup.js'],
};
