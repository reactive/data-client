import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Default vitest settings on purpose: no server.deps.inline
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
});
