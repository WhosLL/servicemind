import { chromium } from 'playwright'

const url = process.argv[2]
if (!url) {
  console.error('usage: node scripts/browser-check.mjs <url>')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()

const logs = []
const errors = []
const failed = []

const allReqs = []
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', e => errors.push(e.message))
page.on('requestfailed', r => failed.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`))
page.on('request', r => { const u = r.url(); if (!u.startsWith('data:') && !u.match(/\.(png|jpg|svg|woff|css|ico|webp)(\?|$)/)) allReqs.push({ m: r.method(), u, hdrs: r.headers() }) })
page.on('response', async r => {
  const u = r.url()
  if (u.startsWith('data:') || u.match(/\.(png|jpg|svg|woff|css|ico|webp)(\?|$)/)) return
  const body = await r.text().catch(() => '(unreadable)')
  const rec = allReqs.find(x => x.u === u && !x.status)
  if (rec) { rec.status = r.status(); rec.body = body.slice(0, 500) }
})

const gotoErr = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).then(() => null).catch(e => e.message)
await page.waitForTimeout(8000)

const title = await page.title()
const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200)

console.log('URL:', url)
console.log('TITLE:', title)
if (gotoErr) console.log('GOTO ERROR:', gotoErr)
console.log('--- VISIBLE TEXT ---')
console.log(bodyText)
console.log('--- CONSOLE ---')
logs.forEach(l => console.log(l))
console.log('--- PAGE ERRORS ---')
errors.forEach(e => console.log(e))
console.log('--- FAILED REQUESTS ---')
failed.forEach(f => console.log(f))
console.log('--- ALL NON-STATIC REQUESTS ---')
allReqs.forEach(r => console.log(`${r.m} ${r.u}\n  status=${r.status ?? 'PENDING'} apikey=${(r.hdrs.apikey || '').slice(0,30)}\n  body=${(r.body || '').slice(0,300)}`))

await browser.close()
