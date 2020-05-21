module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  return {
    presets: [
      [
        '@anansi/babel-preset',
        {
          typing: 'typescript',
          loose: true,
        },
      ],
    ],
    // allows us to load .babelrc in addition to this
    babelrcRoots: ['packages/*', '__tests__'],
  };
};
