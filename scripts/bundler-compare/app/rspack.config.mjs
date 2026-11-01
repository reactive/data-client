// rspack's default chunking (splitChunks for async chunks): one lazy chunk per page
import { fileURLToPath } from 'url';

export default {
  entry: './src/main.tsx',
  target: ['web', 'es2020'],
  output: {
    path: fileURLToPath(new URL('./dist/rspack', import.meta.url)),
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
          },
        },
      },
    ],
  },
};
