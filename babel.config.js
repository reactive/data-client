module.exports = function(api) {
  api.cache.using(() => process.env.NODE_ENV);
  return {
    "presets": [
      [
        "@anansi/babel-preset",
        {
          "typing": "typescript",
          "loose": true,
          // for now only use ~/ in rest-hooks so we can hardcode this.
          // blocked on ts-jest being more flexible here
          rootPathRoot: `${__dirname}/packages/rest-hooks`,
        }
      ]
    ],
    // allows us to load .babelrc in addition to this
    babelrcRoots: [
      "packages/*",
    ],
  };
}
