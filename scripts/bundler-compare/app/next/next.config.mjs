import path from 'path';

// node_modules lives in scripts/bundler-compare, so the root (Turbopack's too) must include it
const root = path.resolve(import.meta.dirname, '../..');
export default {
  outputFileTracingRoot: root,
  // measures bundles only; the repo's own tsc checks the code
  typescript: { ignoreBuildErrors: true },
};
