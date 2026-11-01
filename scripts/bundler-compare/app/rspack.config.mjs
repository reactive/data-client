// rspack defaults (splitChunks for async chunks): one lazy chunk per page
export default {
  mode: 'production',
  entry: './src/main.tsx',
  target: ['web', 'es2020'],
  devtool: false,
  output: {
    path: new URL('./dist/rspack', import.meta.url).pathname,
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
            target: 'es2020',
          },
        },
      },
    ],
  },
};
