// Vite 8 (Rolldown) defaults: one lazy chunk per page
export default {
  logLevel: 'error',
  build: {
    outDir: 'dist/vite',
    emptyOutDir: true,
    target: 'es2020',
    modulePreload: false,
  },
  oxc: { jsx: { runtime: 'automatic' } },
};
