module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'enhance', 'fix', 'pkg', 'internal', 'docs'],
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
  },
};
