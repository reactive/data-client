/* global require, module, __dirname */
const path = require('path');

const siteSrc = path.join(__dirname, 'src') + path.sep;

module.exports = {
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
  plugins: [
    [
      'babel-plugin-react-compiler',
      // Only our own components; Docusaurus also runs this config on its
      // theme packages and on workspace @data-client builds.
      { sources: filename => filename.startsWith(siteSrc) },
    ],
  ],
};
