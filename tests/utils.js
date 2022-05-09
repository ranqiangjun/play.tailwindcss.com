const { expect } = require('@playwright/test')

module.exports.initialBuild = async function initialBuild(page) {
  let iframe = page.frameLocator('iframe')
  let stylesheet = iframe.locator('#_style')
  await expect(stylesheet).toContainText('/* ! tailwindcss v', {
    timeout: 12000,
  })
  return { iframe }
}

module.exports.editTab = async function editTab(
  page,
  browserName,
  tab,
  content
) {
  await page.locator(`button:text-is("${tab}")`).click()
  await page.locator('.monaco-scrollable-element').first().click()
  let modifier = browserName === 'webkit' ? 'Meta' : 'Control'
  await page.keyboard.press(`${modifier}+A`)
  await page.keyboard.press('Backspace')
  await page.keyboard.type(content)
}
