import path from 'path';

// node_modules lives in scripts/bundler-compare, so Turbopack's root must include it
const root = path.resolve(import.meta.dirname, '../..');
export default {
  turbopack: { root },
  outputFileTracingRoot: root,
  typescript: { ignoreBuildErrors: true },
};
