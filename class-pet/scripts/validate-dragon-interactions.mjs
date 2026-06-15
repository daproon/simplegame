import { chromium } from 'playwright';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  const text = message.text();
  const ignored = text.startsWith("THREE.GLTFLoader: Couldn't load texture blob:");
  if (message.type() === 'error' && !ignored) errors.push(text);
});

await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#petAvatar canvas');
await page.evaluate(() => {
  localStorage.setItem('class-pet-adventure-v2', JSON.stringify({
    schemaVersion: 2,
    classStars: 60,
    dragonCoins: 0,
    petHunger: 35,
    petHappiness: 50,
    currentGoal: 'moon_egg_day_01',
    adventureMeterValue: 0,
    adventureMeterTarget: 20,
    milestonesReached: [],
    rewardReady: false,
    queuedRewards: [],
    completedAdventures: [],
    unlockedItems: [],
    environmentProgress: {
      moonEggStage: 0,
      slots: { egg: 'moon_egg', companion: null, lantern: null, garden: null, bridge: null, airship: null, trophy: null, sleeping_area: null, seasonal: null },
    },
    weeklyStoryProgress: 0,
    awardHistory: [],
    teacherSettings: {
      adventureEnabled: false,
      awardReasons: [
        { amount: 1, reason: 'Great participation' },
        { amount: 2, reason: 'Ready to learn' },
        { amount: 3, reason: 'Excellent transition' },
        { amount: 3, reason: 'Great teamwork' },
        { amount: 5, reason: 'Class goal achieved' },
      ],
      dailyTarget: 20,
      volume: 0.7,
      reducedMotion: false,
      pace: 'standard',
    },
    rewardMode: 'teacher_choice',
    quietMode: false,
    animationsPaused: false,
    dragonName: 'Lumi',
    className: 'Our Class',
    scrapbookEntries: [],
    activeChoiceId: null,
  }));
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#feedButton');
await page.click('#starChipButton');
await page.waitForSelector('button[data-award="5"]');
await page.evaluate(() => document.querySelector('.modal .close')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

await page.click('#feedButton');
await page.waitForTimeout(4200);
const afterFeed = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}'));

await page.click('#petButton');
await page.waitForSelector('.tap-prompt');
await page.evaluate(() => document.querySelector('.tap-prompt')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await page.waitForTimeout(1200);
const afterPet = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}'));

await page.click('#playButton');
for (let i = 0; i < 3; i += 1) {
  await page.waitForFunction(() => Boolean(document.querySelector('.tap-prompt')), null, { timeout: 15000 });
  await page.evaluate(() => document.querySelector('.tap-prompt')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(2500);
const afterPlay = await page.evaluate(() => JSON.parse(localStorage.getItem('class-pet-adventure-v2') || '{}'));

const assertions = {
  starChipOpensAwards: true,
  feedSpentStars: afterFeed.classStars === 50,
  feedFilledHunger: afterFeed.petHunger === 100,
  petSpentStars: afterPet.classStars === 40,
  petRaisedHappiness: afterPet.petHappiness > afterFeed.petHappiness,
  playSpentStars: afterPlay.classStars === 30,
  playReducedHunger: afterPlay.petHunger < afterPet.petHunger,
  playRaisedHappiness: afterPlay.petHappiness > afterPet.petHappiness,
  runtimeErrors: errors,
};

console.log(JSON.stringify(assertions, null, 2));
await browser.close();
if (errors.length || Object.entries(assertions).some(([key, value]) => key !== 'runtimeErrors' && value !== true)) {
  process.exit(1);
}
