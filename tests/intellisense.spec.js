const { test, expect } = require('@playwright/test')
const utils = require('./utils')

test.describe.configure({ mode: 'parallel' })

test('hover', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div class="uppercase"></div>'
  )

  await page.locator(`:text-is('"uppercase"')`).hover()
  await expect(page.locator('text=text-transform: uppercase')).toBeVisible()
})

test('autocomplete', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div class="uppercase"></div>'
  )

  await page.locator(`:text-is('"uppercase"')`).dblclick()
  await page.keyboard.type('lowe')
  await expect(page.locator('text=text-transform: lowercase')).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(page.locator(`:text-is('"lowercase"')`)).toBeVisible()
})

test('diagnostics', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div class="uppercase lowercase"></div>'
  )

  await expect(page.locator('.squiggly-warning').first()).toBeVisible()

  await page.locator(`:text-is('"uppercase lowercase"')`).hover()
  await expect(
    page.locator(
      `text="'uppercase' applies the same CSS properties as 'lowercase'."`
    )
  ).toBeVisible()
})

// TODO
test.skip('color decorators', async ({ page, browserName }) => {
  await page.goto('/')

  await utils.initialBuild(page)

  await utils.editTab(
    page,
    browserName,
    'HTML',
    '<div class="bg-red-500"></div>'
  )

  await expect(page.locator(`text=bg-red-500`)).toBeVisible()

  let block = page.locator('._color-block-0')
  await expect(block).toBeVisible()
  expect(
    await block.evaluate(
      (node) => window.getComputedStyle(node, ':before').backgroundColor
    )
  ).toEqual('rgb(239, 68, 68)')
})
