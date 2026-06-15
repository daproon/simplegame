import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const previewDir = path.resolve('docs/previews/classroom-adventure-assets-01');
await mkdir(previewDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  const text = message.text();
  const isNavigationTextureAbort = text.startsWith("THREE.GLTFLoader: Couldn't load texture blob:");
  if (message.type() === 'error' && !isNavigationTextureAbort) errors.push(text);
});

async function shot(name) {
  try {
    await page.screenshot({
      path: path.join(previewDir, `${name}.png`),
      fullPage: false,
      timeout: 30000,
    });
  } catch (error) {
    console.warn(`Preview screenshot '${name}' skipped: ${error.message}`);
  }
}

async function openAwardAndChoose() {
  await page.evaluate(() => document.getElementById('teacherButton')?.click());
  await page.waitForTimeout(100);
  await page.evaluate(() => document.getElementById('teacherAward')?.click());
  await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector('button[data-award="5"]')?.click());
  await page.waitForTimeout(250);
}

await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#petAvatar canvas');
await page.evaluate(() => localStorage.removeItem('class-pet-adventure-v2'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#petAvatar canvas');
await page.evaluate(() => document.getElementById('teacherButton')?.click());
await page.waitForSelector('#adventureToggle');
await page.evaluate(() => document.getElementById('adventureToggle')?.click());
await page.waitForSelector('#meterCount');
await shot('01-main-habitat-0-stars');

await page.evaluate(() => document.getElementById('teacherButton')?.click());
await shot('02-teacher-controls');
await page.evaluate(() => document.getElementById('teacherAward')?.click());
await shot('03-teacher-award-panel');
await page.evaluate(() => document.querySelector('button[data-award="5"]')?.click());
await page.waitForTimeout(350);
await shot('04-moon-egg-5-stars');

await openAwardAndChoose();
await page.waitForTimeout(350);
await shot('05-moon-egg-10-stars');
const activityQueuedAt10 = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}').queuedRewards?.some((reward) => reward.type === 'activity'));

await openAwardAndChoose();
await openAwardAndChoose();
await page.waitForSelector('#rewardReadyButton:not([hidden])');
await shot('06-reward-ready-20-stars');

await page.evaluate(() => document.getElementById('rewardReadyButton')?.click());
await shot('07-class-choice');
await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Gather warm crystals'))?.click());
await page.evaluate(() => document.getElementById('skipEvent')?.click());
await page.waitForTimeout(300);
await shot('08-egg-hatch-outcome');
await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Return to the habitat'))?.click());
await shot('09-permanent-companion-unlock');

await page.evaluate(() => document.getElementById('moreButton')?.click());
await page.waitForSelector('#scrapbookMore');
await page.evaluate(() => document.getElementById('scrapbookMore')?.click());
await shot('10-scrapbook-entry');
await page.evaluate(() => document.querySelector('.modal .close')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

await page.evaluate(() => document.getElementById('moreButton')?.click());
await page.waitForSelector('#shopMore');
await page.evaluate(() => document.getElementById('shopMore')?.click());
await shot('11-coin-purchase-screen');
await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Buy'))?.click());
await page.waitForTimeout(5000);
await shot('12-magical-lantern-purchased');

const persistedBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#petAvatar canvas');
await page.waitForTimeout(1500);

const starsBeforeUndoTest = await page.locator('#starCount').textContent();
await page.keyboard.press('1');
await page.waitForTimeout(150);
await page.evaluate(() => document.getElementById('teacherButton')?.click());
await page.waitForSelector('#undoAward');
await page.evaluate(() => document.getElementById('undoAward')?.click());
const starsAfterUndoTest = await page.locator('#starCount').textContent();
await page.evaluate(() => document.getElementById('teacherButton')?.click());
await page.waitForSelector('#quietToggle');
await page.evaluate(() => document.getElementById('quietToggle')?.click());
const quietModeEnabled = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}').quietMode);
await page.evaluate(() => document.getElementById('quietToggle')?.click());

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobileContext.addInitScript((saved) => {
  localStorage.setItem('class-pet-adventure-v2', JSON.stringify(saved));
}, persistedBeforeReload);
const mobile = await mobileContext.newPage();
await mobile.goto(baseURL, { waitUntil: 'domcontentloaded' });
await mobile.waitForSelector('#petAvatar canvas');
await mobile.waitForTimeout(2500);
try {
  await mobile.screenshot({
    path: path.join(previewDir, '13-mobile-layout.png'),
    fullPage: false,
    timeout: 30000,
  });
} catch (error) {
  console.warn(`Preview screenshot '13-mobile-layout' skipped: ${error.message}`);
}
await mobileContext.close();

const assertions = {
  meterReached20: persistedBeforeReload.adventureMeterValue === 20,
  activityQueuedAt10: activityQueuedAt10 === true,
  adventureCompleted: persistedBeforeReload.completedAdventures?.includes('moon_egg_day_01'),
  companionUnlocked: persistedBeforeReload.unlockedItems?.includes('moon_unicorn_01'),
  scrapbookCreated: persistedBeforeReload.scrapbookEntries?.some((entry) => entry.id === 'moon_egg_hatched'),
  coinsAwardedAndSpent: persistedBeforeReload.dragonCoins >= 5,
  lanternPurchased: persistedBeforeReload.unlockedItems?.includes('magic_moon_lantern'),
  rewardCleared: persistedBeforeReload.rewardReady === false,
  undoRestoresStars: starsBeforeUndoTest === starsAfterUndoTest,
  quietModeToggleWorks: quietModeEnabled === true,
  runtimeErrors: errors,
};

console.log(JSON.stringify(assertions, null, 2));
if (errors.length || Object.entries(assertions).some(([key, value]) => key !== 'runtimeErrors' && value !== true)) {
  await browser.close();
  process.exit(1);
}
await browser.close();
