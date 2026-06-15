import type { Pet } from './types';
import type { ClassroomAdventureState } from './adventureTypes';
import { MOON_EGG_GOAL } from './adventureContent';

const ADVENTURE_KEY = 'class-pet-adventure-v2';
const LEGACY_KEY = 'class-pet-store';

export class AdventureStorageRepository {
  load(pets: Pet[], currentPet: Pet | null): ClassroomAdventureState {
    try {
      const stored = localStorage.getItem(ADVENTURE_KEY);
      if (stored) return this.normalize(JSON.parse(stored) as Partial<ClassroomAdventureState>);
    } catch (error) {
      console.warn('Could not load classroom adventure save:', error);
    }
    return this.migrateLegacy(pets, currentPet);
  }

  save(state: ClassroomAdventureState): void {
    localStorage.setItem(ADVENTURE_KEY, JSON.stringify(state));
  }

  clear(): void {
    localStorage.removeItem(ADVENTURE_KEY);
  }

  private migrateLegacy(pets: Pet[], currentPet: Pet | null): ClassroomAdventureState {
    const legacyPet = currentPet ?? pets[0] ?? null;
    const introductoryStars = Math.min(5, Math.floor((legacyPet?.experience ?? 0) / 50));
    const legacyCoins = legacyPet?.coins ?? 0;
    const state = this.defaultState();
    state.classStars = introductoryStars;
    state.adventureMeterValue = introductoryStars;
    state.dragonCoins = legacyCoins;
    state.dragonName = legacyPet?.name || 'Lumi';
    state.legacyArchive = {
      migratedAt: Date.now(),
      sourceVersion: localStorage.getItem(LEGACY_KEY) ? 1 : 0,
      petNeeds: pets.map((pet) => ({
        petId: pet.id,
        happiness: pet.happiness,
        hunger: pet.hunger,
        energy: pet.energy,
        experience: pet.experience,
        level: pet.level,
      })),
    };
    this.save(state);
    return state;
  }

  defaultState(): ClassroomAdventureState {
    return {
      schemaVersion: 2,
      classStars: 0,
      dragonCoins: 0,
      petHunger: 45,
      petHappiness: 70,
      lastInteractionAt: Date.now(),
      currentGoal: MOON_EGG_GOAL.id,
      adventureMeterValue: 0,
      adventureMeterTarget: MOON_EGG_GOAL.targetStars,
      milestonesReached: [],
      rewardReady: false,
      queuedRewards: [],
      completedAdventures: [],
      unlockedItems: [],
      environmentProgress: {
        moonEggStage: 0,
        slots: {
          egg: 'moon_egg',
          companion: null,
          lantern: null,
          garden: null,
          bridge: null,
          airship: null,
          trophy: null,
          sleeping_area: null,
          seasonal: null,
        },
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
        musicMuted: false,
        sfxMuted: false,
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
    };
  }

  private normalize(input: Partial<ClassroomAdventureState>): ClassroomAdventureState {
    const defaults = this.defaultState();
    const lastInteractionAt = input.lastInteractionAt ?? Date.now();
    const rawHappiness = input.petHappiness ?? defaults.petHappiness;
    const elapsedMs = Math.max(0, Date.now() - lastInteractionAt);
    const twoDaysMs = 48 * 60 * 60 * 1000;
    const happinessDecay = Math.min(100, (elapsedMs / twoDaysMs) * 100);
    const decayedHappiness = Math.max(0, rawHappiness - happinessDecay);
    const unlockedItems = (input.unlockedItems ?? []).map((item) => {
      if (item === 'moon_companion_01') return 'moon_unicorn_01';
      if (item === 'star_lantern_01') return 'magic_moon_lantern';
      return item;
    });
    const slots = { ...defaults.environmentProgress.slots, ...input.environmentProgress?.slots };
    if (slots.companion === 'moon_companion_01') slots.companion = 'moon_unicorn_01';
    if (slots.lantern === 'star_lantern_01') slots.lantern = 'magic_moon_lantern';
    return {
      ...defaults,
      ...input,
      schemaVersion: 2,
      petHunger: Math.max(0, Math.min(100, input.petHunger ?? defaults.petHunger)),
      petHappiness: Math.max(0, Math.min(100, decayedHappiness)),
      lastInteractionAt,
      teacherSettings: { ...defaults.teacherSettings, ...input.teacherSettings },
      environmentProgress: {
        ...defaults.environmentProgress,
        ...input.environmentProgress,
        slots,
      },
      awardHistory: input.awardHistory ?? [],
      queuedRewards: input.queuedRewards ?? [],
      scrapbookEntries: input.scrapbookEntries ?? [],
      unlockedItems: Array.from(new Set(unlockedItems)),
      completedAdventures: input.completedAdventures ?? [],
      milestonesReached: input.milestonesReached ?? [],
    };
  }
}
