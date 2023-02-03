module.exports = function (context, options) {
  return {
    name: 'raw-plugin',
    // to support running babel transformer we need to polyfill node api 'fs'
    configureWebpack(config, isServer, utils) {
      return {
        module: {
          rules: [
            {
              resourceQuery: /raw/,
              type: 'asset/source',
            },
            /*{
              test: /\.m?[jt]sx?$/i,
              //exclude: config.module.rules
              oneOf: [
                {
                  resourceQuery: /raw/,
                  type: 'asset/source',
                },
                {
                  resourceQuery: { not: [/raw/] },
                  ...utils.getJSLoader(isServer),
                },
              ],
            },*/
          ],
        },
      };
    },
  };
};
