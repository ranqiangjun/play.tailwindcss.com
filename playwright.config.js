const path = require('path')

module.exports = {
  testDir: path.join(__dirname, 'tests'),
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
