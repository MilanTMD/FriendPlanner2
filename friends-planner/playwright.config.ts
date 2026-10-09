import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) process.loadEnvFile('.env');

const globalSetup = 'tests/e2e/global-setup.ts';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  ...(existsSync(globalSetup) ? { globalSetup } : {}),
  timeout: 20_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8888',
    locale: 'en-GB',
    timezoneId: 'Europe/Prague',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 5_000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8888/api/health',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'mobile-375',
      grepInvert: /@tz/,
      use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: 'tablet-768',
      grepInvert: /@tz/,
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop-1440',
      grepInvert: /@tz/,
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tz-plus14',
      grep: /@tz/,
      use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, timezoneId: 'Pacific/Kiritimati' },
    },
    {
      name: 'tz-minus11',
      grep: /@tz/,
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, timezoneId: 'Pacific/Pago_Pago' },
    },
  ],
});
