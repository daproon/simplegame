import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const outDir = 'docs/previews/environment-composition-fix-01';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 2048, height: 1152 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.waitForSelector('#petAvatar canvas');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${outDir}/game-camera.png`, fullPage: true });
console.log(JSON.stringify({ errors, screenshot: `${outDir}/game-camera.png` }, null, 2));
await browser.close();
if (errors.length) process.exit(1);
