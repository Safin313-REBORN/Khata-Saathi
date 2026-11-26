import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
  },
  webServer: {
    command: 'PORT=3001 SQLITE_PATH=./storage/e2e-khata.db pnpm --filter @khata-saathi/api start',
    url: 'http://127.0.0.1:3001/health',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
