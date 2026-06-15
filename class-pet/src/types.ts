export type PetType = 'dog' | 'cat' | 'unicorn' | 'dragon' | 'phoenix' | 'trex' | 'triceratops' | 'stegosaurus' | 'pterodactyl';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  level: number;
  happiness: number;
  hunger: number;
  energy: number;
  experience: number;
  xp?: number;
  coins: number;
  createdAt: number;
  lastFedAt: number;
  lastPlayedAt: number;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'food' | 'toy' | 'decoration' | 'cosmetic';
  quantity: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'food' | 'toy' | 'decoration' | 'cosmetic';
  icon: string;
}

export interface GameStats {
  totalCoinsEarned: number;
  totalLevelUps: number;
  totalPetsOwned: number;
}

export interface TeacherSettings {
  rewardCoinsPerDay: number;
  rewardCoinsPerGoodBehavior: number;
  rewardCoinsPerHomework: number;
  classCode: string;
  className: string;
}

export interface ClassData {
  code: string;
  name: string;
  teacher: string;
  createdAt: number;
  settings: TeacherSettings;
  totalCoinsDistributed: number;
}

export interface Pet3DModel {
  petType: PetType;
  modelUrl: string;
  scale: number;
  soundUrl: string;
}

