import type { DailyGoalDefinition } from './adventureTypes';

export const MOON_EGG_GOAL: DailyGoalDefinition = {
  id: 'moon_egg_day_01',
  title: 'Warm the Moon Egg',
  description: 'A mysterious Moon Egg appeared overnight. Help your dragon warm it.',
  targetStars: 20,
  milestones: [
    { stars: 5, event: 'egg_shake_small', label: 'The egg stirred!' },
    { stars: 10, event: 'egg_first_crack', label: 'A silver crack appeared.', rewardId: 'moon_egg_choice_preview' },
    { stars: 15, event: 'egg_large_crack', label: 'The Moon Egg is almost ready!' },
    { stars: 20, event: 'egg_reward_ready', label: 'The egg is ready to hatch.', rewardId: 'moon_egg_hatch' },
  ],
  choices: [
    {
      id: 'warm_crystals',
      label: 'Gather warm crystals',
      icon: '💎',
      story: 'The class gathered glowing crystals and made a circle of moonlight.',
    },
    {
      id: 'soft_nest',
      label: 'Build a soft nest',
      icon: '🪹',
      story: 'The class built the softest nest in the whole moonlit forest.',
    },
  ],
  reward: {
    coins: 30,
    unlockId: 'moon_unicorn_01',
    scrapbookEntry: 'moon_egg_hatched',
  },
};

export const PROTOTYPE_GOALS: Record<string, DailyGoalDefinition> = {
  [MOON_EGG_GOAL.id]: MOON_EGG_GOAL,
};

export function getGoalDefinition(id: string): DailyGoalDefinition {
  const goal = PROTOTYPE_GOALS[id];
  if (!goal || goal.targetStars <= 0 || goal.choices.length < 2) {
    console.warn(`Invalid adventure content '${id}', using Moon Egg fallback.`);
    return MOON_EGG_GOAL;
  }
  return goal;
}

export const HABITAT_SHOP_ITEMS = [
  {
    id: 'magic_moon_lantern',
    name: 'Magical Moon Lantern',
    description: 'A softly glowing lantern that makes the dragon’s habitat feel warm and magical.',
    cost: 25,
    icon: '🏮',
    slot: 'lantern',
  },
] as const;
