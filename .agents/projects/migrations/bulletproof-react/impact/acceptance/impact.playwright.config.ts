import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /impact-.*\.spec\.ts/,
  reporter: 'line',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:3100',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'npx vite --port 3100 --strictPort',
    port: 3100,
    timeout: 60_000,
    reuseExistingServer: false,
  },
});
