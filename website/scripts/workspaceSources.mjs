import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * esbuild plugin that bundles `@data-client/*` from the workspace sources,
 * like moduleNameMapper in jest.config.js
 */
export const workspaceSources = {
  name: 'data-client-src',
  setup(build) {
    build.onResolve({ filter: /^@data-client\// }, args => {
      const src = args.path.replace(/^@data-client\/([^/]+)/, '$1/src');
      return build.resolve(`./packages/${src}`, {
        kind: args.kind,
        resolveDir: root,
      });
    });
  },
};
