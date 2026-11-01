// Vite 8 (Rolldown) defaults: one lazy chunk per page
export default {
  logLevel: 'error',
  build: {
    outDir: 'dist/vite',
    target: 'es2020',
    modulePreload: false,
  },
};
