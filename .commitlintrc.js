module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      // Relaxes max length rules for dependency updates, which can regularly
      // exceed limits set by commitlint.
      // See https://github.com/dependabot/dependabot-core/issues/2445
      // The following solution is taken from
      // https://github.com/vidavidorra/commitlint-config/blob/master/commitlint.config.js
      rules: {
        'header-max-length-deps': (parsed) => {
          const config = {
            maxLength: 100,
            dependencyCommit: {
              type: /^(chore|fix)/,
              scope: /^(peer-)?deps(-dev)?$/,
              maxLength: 200
            }
          }

          const length = parsed.header.length
          const isDepsCommit =
            config.dependencyCommit.type.test(parsed.type) &&
            config.dependencyCommit.scope.test(parsed.scope)

          if (length <= config.maxLength) {
            return [true]
          }

          if (!isDepsCommit && length > config.maxLength) {
            return [
              false,
              [
                `header must not be longer than ${config.maxLength}`,
                `characters, current length is ${length}`
              ].join(' ')
            ]
          }

          if (isDepsCommit && length > config.dependencyCommit.maxLength) {
            return [
              false,
              [
                'header for dependency commits must not be longer than',
                `${config.dependencyCommit.maxLength} characters, current`,
                `length is ${length}`
              ].join(' ')
            ]
          }

          return [true]
        }
      }
    }
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'enhance', 'fix', 'pkg', 'internal', 'docs'],
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    // Completely relaxes body and footer line length
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    // Replace header-max-length rule with one that relaxes it for dependency updates
    'header-max-length': [0],
    'header-max-length-deps': [2, 'always'],
  },
};
