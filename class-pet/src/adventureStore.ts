import type { ClassroomAdventureState, RewardMode, ScrapbookEntry } from './adventureTypes';
import { getGoalDefinition, HABITAT_SHOP_ITEMS } from './adventureContent';
import { AdventureStorageRepository } from './adventureStorage';
import { useGameStore } from './store';

export interface AwardResult {
  reachedMilestones: number[];
  rewardBecameReady: boolean;
}

export interface PetInteractionResult {
  ok: boolean;
  message: string;
  hungry?: boolean;
}

class ClassroomAdventureStore {
  private repository = new AdventureStorageRepository();
  private state: ClassroomAdventureState;
  private listeners = new Set<(state: ClassroomAdventureState) => void>();

  constructor() {
    const legacy = useGameStore.getState();
    this.state = this.repository.load(legacy.pets, legacy.currentPet);
    this.repository.save(this.state);
  }

  getState(): ClassroomAdventureState {
    return structuredClone(this.state);
  }

  subscribe(listener: (state: ClassroomAdventureState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  awardStars(amount: number, reason: string): AwardResult {
    const safeAmount = Math.max(1, Math.min(20, Math.round(amount)));
    const goal = getGoalDefinition(this.state.currentGoal);
    const before = this.state.adventureMeterValue;
    this.touchActivity();
    this.state.classStars += safeAmount;
    let reachedMilestones: number[] = [];
    if (this.state.teacherSettings.adventureEnabled) {
      this.state.adventureMeterValue = Math.min(
        this.state.adventureMeterTarget,
        this.state.adventureMeterValue + safeAmount,
      );
      reachedMilestones = goal.milestones
        .filter((milestone) => before < milestone.stars && this.state.adventureMeterValue >= milestone.stars)
        .map((milestone) => milestone.stars);
      reachedMilestones.forEach((stars) => this.reachMilestone(stars));
    }
    this.state.awardHistory.unshift({
      id: crypto.randomUUID(),
      amount: safeAmount,
      reason,
      timestamp: Date.now(),
      undone: false,
      kind: 'award',
    });
    this.commit();
    return {
      reachedMilestones,
      rewardBecameReady: reachedMilestones.includes(goal.targetStars),
    };
  }

  undoLastAward(): boolean {
    const award = this.state.awardHistory.find((entry) => entry.kind === 'award' && !entry.undone);
    if (!award) return false;
    award.undone = true;
    this.state.classStars = Math.max(0, this.state.classStars - award.amount);
    if (this.state.teacherSettings.adventureEnabled) {
      this.state.adventureMeterValue = Math.max(0, this.state.adventureMeterValue - award.amount);
    }
    this.state.awardHistory.unshift({
      id: crypto.randomUUID(),
      amount: -award.amount,
      reason: `Undo: ${award.reason}`,
      timestamp: Date.now(),
      undone: false,
      kind: 'undo',
      relatedAwardId: award.id,
    });
    if (this.state.teacherSettings.adventureEnabled) this.recalculateMilestones();
    this.commit();
    return true;
  }

  setAdventureEnabled(value: boolean): void {
    this.state.teacherSettings.adventureEnabled = value;
    if (!value) {
      this.state.rewardReady = false;
      this.state.queuedRewards = this.state.queuedRewards.filter((reward) => reward.status === 'saved');
    }
    this.commit();
  }

  setQuietMode(value: boolean): void {
    this.state.quietMode = value;
    this.commit();
  }

  setMusicMuted(value: boolean): void {
    this.state.teacherSettings.musicMuted = value;
    this.commit();
  }

  setSfxMuted(value: boolean): void {
    this.state.teacherSettings.sfxMuted = value;
    this.commit();
  }

  setAnimationsPaused(value: boolean): void {
    this.state.animationsPaused = value;
    this.commit();
  }

  feedDragon(): PetInteractionResult {
    const spent = this.spendStars(10, 'Feed Magical Berry');
    if (!spent.ok) return spent;
    this.touchActivity();
    this.state.petHunger = 100;
    this.state.petHappiness = Math.min(100, this.state.petHappiness + 5);
    this.commit();
    return { ok: true, message: 'The dragon is nicely fed.' };
  }

  playWithDragon(): PetInteractionResult {
    if (this.state.petHunger < 30) {
      return { ok: false, hungry: true, message: 'The dragon is hungry. Feed a Magical Berry first.' };
    }
    const spent = this.spendStars(10, 'Play with dragon');
    if (!spent.ok) return spent;
    this.touchActivity();
    this.state.petHunger = Math.max(0, this.state.petHunger - 35);
    this.state.petHappiness = Math.min(100, this.state.petHappiness + 22);
    this.commit();
    return { ok: true, message: 'Play time made the dragon happy.' };
  }

  petDragon(): PetInteractionResult {
    if (this.state.petHunger < 25) {
      return { ok: false, hungry: true, message: 'The dragon wants a snack before more pets.' };
    }
    const spent = this.spendStars(10, 'Pet dragon');
    if (!spent.ok) return spent;
    this.touchActivity();
    this.state.petHunger = Math.max(0, this.state.petHunger - 25);
    this.state.petHappiness = Math.min(100, this.state.petHappiness + 15);
    this.commit();
    return { ok: true, message: 'The dragon gives a happy little coo.' };
  }

  setRewardMode(mode: RewardMode): void {
    this.state.rewardMode = mode;
    this.commit();
  }

  saveRewardForLater(): void {
    this.state.queuedRewards = this.state.queuedRewards.map((reward) => (
      reward.type === 'adventure' ? { ...reward, status: 'saved' } : reward
    ));
    this.commit();
  }

  completeQueuedActivity(rewardId: string): void {
    this.state.queuedRewards = this.state.queuedRewards.filter((reward) => reward.id !== rewardId);
    this.commit();
  }

  setDailyTarget(target: number): void {
    const safeTarget = Math.max(5, Math.min(100, Math.round(target)));
    this.state.adventureMeterTarget = safeTarget;
    this.state.teacherSettings.dailyTarget = safeTarget;
    this.commit();
  }

  chooseAdventureOption(choiceId: string): void {
    const goal = getGoalDefinition(this.state.currentGoal);
    if (goal.choices.some((choice) => choice.id === choiceId)) {
      this.state.activeChoiceId = choiceId;
      this.commit();
    }
  }

  completeCurrentAdventure(): void {
    const goal = getGoalDefinition(this.state.currentGoal);
    if (this.state.completedAdventures.includes(goal.id)) return;
    const choice = goal.choices.find((item) => item.id === this.state.activeChoiceId) ?? goal.choices[0];
    this.state.completedAdventures.push(goal.id);
    this.state.dragonCoins += goal.reward.coins;
    this.state.unlockedItems.push(goal.reward.unlockId);
    this.state.environmentProgress.moonEggStage = 5;
    this.state.environmentProgress.slots.egg = 'hatched_moon_egg';
    this.state.environmentProgress.slots.companion = goal.reward.unlockId;
    this.state.rewardReady = false;
    this.state.queuedRewards = this.state.queuedRewards.filter((reward) => reward.goalId !== goal.id);
    const entry: ScrapbookEntry = {
      id: goal.reward.scrapbookEntry,
      goalId: goal.id,
      title: 'The Moon Egg Hatched!',
      completedAt: Date.now(),
      choiceId: choice.id,
      choiceLabel: choice.label,
      rewardDiscovered: 'Pip, the Moon Unicorn',
      coinsEarned: goal.reward.coins,
      icon: '🌙',
      story: `${choice.story} A tiny Moon Unicorn named Pip emerged and chose the class as its family.`,
    };
    this.state.scrapbookEntries.push(entry);
    this.commit();
  }

  purchaseItem(itemId: string): { ok: boolean; message: string } {
    const item = HABITAT_SHOP_ITEMS.find((candidate) => candidate.id === itemId);
    if (!item) return { ok: false, message: 'Item unavailable.' };
    if (this.state.unlockedItems.includes(item.id)) return { ok: false, message: 'Already owned.' };
    if (this.state.dragonCoins < item.cost) return { ok: false, message: 'Not enough Dragon Coins.' };
    this.state.dragonCoins -= item.cost;
    this.state.unlockedItems.push(item.id);
    this.state.environmentProgress.slots[item.slot] = item.id;
    this.commit();
    return { ok: true, message: `${item.name} added to the habitat.` };
  }

  updateNames(className: string, dragonName: string): void {
    this.state.className = className.trim().slice(0, 40) || 'Our Class';
    this.state.dragonName = dragonName.trim().slice(0, 20) || 'Lumi';
    this.commit();
  }

  resetDemo(): void {
    const names = { className: this.state.className, dragonName: this.state.dragonName };
    this.repository.clear();
    this.state = { ...this.repository.defaultState(), ...names };
    this.commit();
  }

  debugSetStars(stars: number): void {
    this.state.adventureMeterValue = Math.max(0, Math.min(this.state.adventureMeterTarget, stars));
    this.state.classStars = Math.max(this.state.classStars, this.state.adventureMeterValue);
    this.recalculateMilestones();
    this.commit();
  }

  private spendStars(amount: number, reason: string): PetInteractionResult {
    const safeAmount = Math.max(1, Math.round(amount));
    if (this.state.classStars < safeAmount) {
      return { ok: false, message: `Need ${safeAmount} Stars for ${reason}.` };
    }
    this.state.classStars -= safeAmount;
    this.state.awardHistory.unshift({
      id: crypto.randomUUID(),
      amount: -safeAmount,
      reason,
      timestamp: Date.now(),
      undone: false,
      kind: 'undo',
    });
    return { ok: true, message: `${reason} started.` };
  }

  private touchActivity(): void {
    this.state.lastInteractionAt = Date.now();
  }

  private reachMilestone(stars: number): void {
    if (this.state.milestonesReached.includes(stars)) return;
    this.state.milestonesReached.push(stars);
    this.state.environmentProgress.moonEggStage = Math.min(4, Math.floor(stars / 5)) as 1 | 2 | 3 | 4;
    const goal = getGoalDefinition(this.state.currentGoal);
    const milestone = goal.milestones.find((item) => item.stars === stars);
    if (milestone?.rewardId) {
      this.state.queuedRewards.push({
        id: milestone.rewardId,
        goalId: goal.id,
        milestoneStars: stars,
        type: stars >= goal.targetStars ? 'adventure' : 'activity',
        title: milestone.label,
        status: 'ready',
        queuedAt: Date.now(),
      });
    }
    if (stars >= goal.targetStars) this.state.rewardReady = true;
  }

  private recalculateMilestones(): void {
    if (this.state.completedAdventures.includes(this.state.currentGoal)) return;
    const goal = getGoalDefinition(this.state.currentGoal);
    this.state.milestonesReached = [];
    this.state.queuedRewards = [];
    this.state.rewardReady = false;
    this.state.environmentProgress.moonEggStage = 0;
    goal.milestones.forEach((milestone) => {
      if (this.state.adventureMeterValue >= milestone.stars) this.reachMilestone(milestone.stars);
    });
  }

  private commit(): void {
    this.repository.save(this.state);
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const classroomAdventureStore = new ClassroomAdventureStore();
