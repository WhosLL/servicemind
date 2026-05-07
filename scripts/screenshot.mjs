import { chromium } from 'playwright'

const url = process.argv[2]
const outDir = process.argv[3] || 'C:/Users/rank1/Desktop/ServiceMind/app/scripts'
if (!url) {
  console.error('usage: node scripts/screenshot.mjs <url> [out-dir]')
  process.exit(1)
}

const browser = await chromium.launch()

const shots = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true },
]

for (const s of shots) {
  const ctx = await browser.newContext({ viewport: s.viewport, isMobile: !!s.isMobile })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  const path = `${outDir}/shot-${s.name}.png`
  await page.screenshot({ path, fullPage: true })
  console.log(`saved ${path}`)
  await ctx.close()
}

await browser.close()
