import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.CI
      ? []
      : [
          {
            name: 'mobile-chrome',
            use: {
              ...devices['Pixel 5'],
              viewport: { width: 390, height: 844 },
            },
          },
        ]),
  ],

  webServer: {
    command: 'bun run build && bun run start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
