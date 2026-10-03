/* global require, module, __dirname, Buffer */
const { sidebarsFor } = require('./index.js');

module.exports = sidebarsFor('vue', require('../sidebars.json'));
