const { test, expect } = require('@playwright/test')
const utils = require('./utils')
const {
  version: insidersVersion,
} = require('tailwindcss-insiders/package.json')

test.describe.configure({ mode: 'parallel' })

test('should load', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#__next')).toBeVisible()
})

test('should render the default content', async ({ page }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  let iframe = page.frameLocator('iframe')
  let stylesheet = iframe.locator('#_style')

  // Base
  await expect(stylesheet).toContainText('*, ::before, ::after')

  // Utilities
  await expect(stylesheet).toContainText('.absolute {')
  await expect(stylesheet).toContainText('.flex-col {')

  // HTML
  await expect(iframe.locator('img[alt="Tailwind Play"]')).toBeVisible()
})

test('should initialise monaco editor', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.monaco-mouse-cursor-text').first()).toContainText(
    'Welcome to Tailwind Play'
  )
})

test('should update the preview when editing HTML', async ({
  page,
  browserName,
}) => {
  await page.goto('/')

  let { iframe } = await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div class="text-4xl">Hello World!</div>'
  )

  await expect(iframe.locator('text=Hello World!')).toBeVisible()
  await expect(iframe.locator('text=Hello World!')).toHaveCSS(
    'font-size',
    '36px'
  )
})

test('should update the preview when editing CSS', async ({
  page,
  browserName,
}) => {
  await page.goto('/')

  let { iframe } = await utils.initialBuild(page)

  await utils.editTab(page, browserName, 'CSS', 'body { background: red; }')

  await expect(iframe.locator('body')).toHaveCSS(
    'background-color',
    'rgb(255, 0, 0)'
  )
})

test('should update the preview when editing config', async ({
  page,
  browserName,
}) => {
  await page.goto('/')

  let { iframe } = await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'Config',
    'module.exports={plugins:[function({addBase}){addBase({body:{background:"red'
  )

  await expect(iframe.locator('body')).toHaveCSS(
    'background-color',
    'rgb(255, 0, 0)'
  )
})

test('should tidy HTML', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div    class="sm:p-0 p-0"  >  </div>'
  )

  await page.locator('button:text-is("Tidy")').click()

  await page.waitForFunction(
    () =>
      document.querySelector('textarea.monaco-mouse-cursor-text').value ===
      '<div class="p-0 sm:p-0"></div>\n'
  )
})

test('should tidy CSS', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(page, browserName, 'CSS', 'body    {  color: red;   }')

  await page.locator('button:text-is("Tidy")').click()

  await page.waitForFunction(
    () =>
      document.querySelector('textarea.monaco-mouse-cursor-text').value ===
      'body {\n  color: red;\n}\n'
  )
})

test('should tidy config', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'Config',
    'module.exports={plugins:[function({addBase}){addBase({body:{background:"red'
  )

  await page.locator('button:text-is("Tidy")').click()

  await page.waitForFunction(
    () =>
      document.querySelector('textarea.monaco-mouse-cursor-text').value ===
      `module.exports = {
  plugins: [
    function ({ addBase }) {
      addBase({ body: { background: 'red' } })
    },
  ],
}
`
  )
})

test('should support insiders', async ({ page, browserName }) => {
  await page.goto('/')
  await utils.initialBuild(page)

  await page.click('[data-test=version]')
  await page.click('[data-test=version-insiders]')

  await utils.initialBuild(page, insidersVersion)
})
