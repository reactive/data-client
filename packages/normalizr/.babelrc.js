const { NODE_ENV, BABEL_ENV } = process.env;

const cjs = BABEL_ENV === 'cjs' || NODE_ENV === 'test';

module.exports = {
  presets: [
    ['@anansi/babel-preset', { useESModules: !cjs, loose: true }]
  ]
};
