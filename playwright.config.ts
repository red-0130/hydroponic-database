import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Hydroponic Database System
 * Adheres to TEST_INFRA.md, SCOPE.md, and AGENTS.md standards.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  /* Run tests sequentially to avoid SQLite database lock contention and state pollution */
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if test.only was left in code */
  forbidOnly: !!process.env.CI,
  /* Retries */
  retries: process.env.CI ? 2 : 0,
  /* Reporter */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  outputDir: 'test-results',
  /* Shared settings */
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  /* Only chromium is cached in /home/coder/.cache/ms-playwright */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
  /* Next.js dev server launcher */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
