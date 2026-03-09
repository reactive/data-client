const options = { polyfillMethod: false };
if (process.env.REACT_COMPILER === 'true') {
  options.reactCompiler = {};
}

module.exports = {
  presets: [['@anansi', options]],
};
