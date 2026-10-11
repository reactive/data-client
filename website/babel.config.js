/* global require, module, __dirname */
const path = require('path');

const siteSrc = path.join(__dirname, 'src') + path.sep;

module.exports = api => ({
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
  // SSR renders each component once, so memoizing only pays off in the client bundle
  plugins:
    api.caller(caller => caller?.name) === 'client' ?
      [
        [
          'babel-plugin-react-compiler',
          // Workspace @data-client packages resolve outside node_modules, so the
          // plugin's default filter would compile them too
          { sources: filename => filename.startsWith(siteSrc) },
        ],
      ]
    : [],
});
