import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
  },
  webServer: undefined, // Already running on port 3000
});
