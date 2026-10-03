/* global require, module, __dirname, Buffer */
const { sidebarsFor } = require('./index.js');

module.exports = sidebarsFor('react', require('../sidebars.json'));
