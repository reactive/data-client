// webpack 5 defaults (splitChunks for async chunks): one lazy chunk per page, like rspack.config.mjs
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/main.tsx',
  target: ['web', 'es2020'],
  devtool: false,
  output: { path: path.resolve(__dirname, 'dist/webpack'), clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } },
            },
          },
        },
      },
    ],
  },
};
