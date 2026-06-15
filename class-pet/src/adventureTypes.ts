export type RewardMode = 'teacher_choice' | 'class_vote' | 'automatic' | 'surprise';
export type DragonMood = 'Calm' | 'Curious' | 'Excited' | 'Adventurous' | 'Playful' | 'Sleepy';

export interface AdventureMilestoneDefinition {
  stars: number;
  event: string;
  label: string;
  rewardId?: string;
}

export interface AdventureChoiceDefinition {
  id: string;
  label: string;
  icon: string;
  story: string;
}

export interface AdventureRewardDefinition {
  coins: number;
  unlockId: string;
  scrapbookEntry: string;
}

export interface DailyGoalDefinition {
  id: string;
  title: string;
  description: string;
  targetStars: number;
  milestones: AdventureMilestoneDefinition[];
  choices: AdventureChoiceDefinition[];
  reward: AdventureRewardDefinition;
}

export interface QueuedReward {
  id: string;
  goalId: string;
  milestoneStars: number;
  type: 'activity' | 'adventure';
  title: string;
  status: 'ready' | 'saved';
  queuedAt: number;
}

export interface AwardHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
  undone: boolean;
  kind: 'award' | 'undo';
  relatedAwardId?: string;
}

export interface ScrapbookEntry {
  id: string;
  goalId: string;
  title: string;
  completedAt: number;
  choiceId: string;
  choiceLabel: string;
  rewardDiscovered: string;
  coinsEarned: number;
  icon: string;
  story: string;
}

export interface TeacherAdventureSettings {
  adventureEnabled: boolean;
  awardReasons: Array<{ amount: number; reason: string }>;
  dailyTarget: number;
  volume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  reducedMotion: boolean;
  pace: 'gentle' | 'standard' | 'fast' | 'custom';
}

export interface EnvironmentProgress {
  moonEggStage: 0 | 1 | 2 | 3 | 4 | 5;
  slots: Record<string, string | null>;
}

export interface LegacyArchive {
  migratedAt: number;
  sourceVersion: number;
  petNeeds: Array<{
    petId: string;
    happiness: number;
    hunger: number;
    energy: number;
    experience: number;
    level: number;
  }>;
}

export interface ClassroomAdventureState {
  schemaVersion: 2;
  classStars: number;
  dragonCoins: number;
  petHunger: number;
  petHappiness: number;
  lastInteractionAt: number;
  currentGoal: string;
  adventureMeterValue: number;
  adventureMeterTarget: number;
  milestonesReached: number[];
  rewardReady: boolean;
  queuedRewards: QueuedReward[];
  completedAdventures: string[];
  unlockedItems: string[];
  environmentProgress: EnvironmentProgress;
  weeklyStoryProgress: number;
  awardHistory: AwardHistoryEntry[];
  teacherSettings: TeacherAdventureSettings;
  rewardMode: RewardMode;
  quietMode: boolean;
  animationsPaused: boolean;
  dragonName: string;
  className: string;
  scrapbookEntries: ScrapbookEntry[];
  activeChoiceId: string | null;
  legacyArchive?: LegacyArchive;
}
