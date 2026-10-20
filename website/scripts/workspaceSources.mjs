import { build } from 'esbuild';

import { ROOT } from '../framework-docs/site.mjs';

/** `@data-client/*` from the workspace sources, like moduleNameMapper in jest.config.js */
const workspaceSources = {
  name: 'data-client-src',
  setup(build) {
    build.onResolve({ filter: /^@data-client\// }, args => {
      const src = args.path.replace(/^@data-client\/([^/]+)/, '$1/src');
      return build.resolve(`./packages/${src}`, {
        kind: args.kind,
        resolveDir: ROOT,
      });
    });
  },
};

/**
 * Bundles a dev-mode browser app built from the workspace sources.
 * `entry` is esbuild's `entryPoints` or `stdin` option.
 */
export async function bundleBrowserApp(entry) {
  const { outputFiles } = await build({
    ...entry,
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [workspaceSources],
    logLevel: 'error',
  });
  return outputFiles[0].text;
}
