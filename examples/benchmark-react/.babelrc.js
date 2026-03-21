const options = { polyfillMethod: false };
if (process.env.REACT_COMPILER !== 'false') {
  options.reactCompiler = {};
}

module.exports = {
  presets: [['@anansi', options]],
};
