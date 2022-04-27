const path = require('path')
const { devices } = require('@playwright/test')

module.exports = {
  testDir: path.join(__dirname, 'tests'),
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {
        use: {
          baseURL: process.env.PLAYWRIGHT_BASE_URL,
        },
      }
    : {
        webServer: {
          command: 'npm start',
          port: 3000,
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
        },
      }),
}
