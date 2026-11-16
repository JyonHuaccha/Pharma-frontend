import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/preparar.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/resultados.json' }],
  ],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          ...(process.env['E2E_CHROME_PATH']
            ? { executablePath: process.env['E2E_CHROME_PATH'] }
            : {}),
        },
      },
    },
  ],
  webServer: {
    command: process.env['E2E_PRODUCCION'] === '1'
      ? 'node scripts/servidor-e2e.mjs'
      : 'npm start -- --host 127.0.0.1',
    url: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
