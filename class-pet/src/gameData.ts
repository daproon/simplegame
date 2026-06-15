import type { Pet, PetType } from './types';

export const SHOP_ITEMS = [
  // Food
  { id: 'apple', name: 'Apple', type: 'food', cost: 5, description: 'Healthy snack' },
  { id: 'pizza', name: 'Pizza', type: 'food', cost: 15, description: 'Delicious meal' },
  { id: 'ice_cream', name: 'Ice Cream', type: 'food', cost: 10, description: 'Sweet treat' },
  { id: 'burger', name: 'Burger', type: 'food', cost: 12, description: 'Tasty burger' },
  
  // Toys
  { id: 'ball', name: 'Ball', type: 'toy', cost: 20, description: 'Bouncy toy' },
  { id: 'frisbee', name: 'Frisbee', type: 'toy', cost: 25, description: 'Flying disc' },
  { id: 'stick', name: 'Stick', type: 'toy', cost: 10, description: 'Classic fetch toy' },
  { id: 'rope', name: 'Rope Toy', type: 'toy', cost: 15, description: 'Tug toy' },
  
  // Decorations
  { id: 'house', name: 'Pet House', type: 'decoration', cost: 100, description: 'Cozy home' },
  { id: 'bed', name: 'Soft Bed', type: 'decoration', cost: 75, description: 'Comfortable sleeping spot' },
  { id: 'tree', name: 'Tree', type: 'decoration', cost: 50, description: 'Shade tree' },
  { id: 'bowl', name: 'Food Bowl', type: 'decoration', cost: 30, description: 'Fancy bowl' },
  
  // Cosmetics
  { id: 'bow', name: 'Bow Tie', type: 'cosmetic', cost: 40, description: 'Stylish accessory' },
  { id: 'crown', name: 'Crown', type: 'cosmetic', cost: 150, description: 'Royal accessory' },
  { id: 'sunglasses', name: 'Sunglasses', type: 'cosmetic', cost: 60, description: 'Cool shades' },
  { id: 'collar', name: 'Collar', type: 'cosmetic', cost: 35, description: 'Fancy collar' },
];

export function createNewPet(name: string, type: PetType, id: string = Math.random().toString(36).substr(2, 9)): Pet {
  return {
    id,
    name,
    type,
    level: 1,
    happiness: 75,
    hunger: 50,
    energy: 80,
    experience: 0,
    coins: 50,
    createdAt: Date.now(),
    lastFedAt: Date.now(),
    lastPlayedAt: Date.now(),
    inventory: [
      { id: 'apple', name: 'Apple', type: 'food', quantity: 3 },
    ],
  };
}

export const PET_TYPES: PetType[] = ['dog', 'cat', 'unicorn', 'dragon', 'phoenix', 'trex', 'triceratops', 'stegosaurus', 'pterodactyl'];

export function getPetDescription(type: PetType): string {
  const descriptions: Record<PetType, string> = {
    dog: '🐕 Loyal and playful, loves to fetch and play games!',
    cat: '🐱 Curious and independent, enjoys napping and pouncing!',
    unicorn: '🦄 Magical and sparkly, brings joy wherever it goes!',
    dragon: '🐉 Fierce and powerful, breathes fire and soars high!',
    phoenix: '🔥 Majestic and eternal, rises again stronger each day!',
    trex: '🦖 Mighty T-Rex! A roaring ruler of the dinosaurs!',
    triceratops: '🦕 Three-horned dinosaur with a friendly disposition!',
    stegosaurus: '🦕 Plates on its back and a friendly nature!',
    pterodactyl: '🦕 Flying dinosaur that soars through the sky!',
  };
  return descriptions[type];
}

export function calculateStats(pet: Pet) {
  return {
    levelProgress: (pet.experience / ((pet.level + 1) * 100)) * 100,
    hungerPercentage: Math.max(0, Math.min(100, pet.hunger)),
    happinessPercentage: Math.max(0, Math.min(100, pet.happiness)),
    energyPercentage: Math.max(0, Math.min(100, pet.energy)),
  };
}

export function getDaysSinceFed(lastFedAt: number): string {
  const now = Date.now();
  const diff = now - lastFedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'recently';
}

export const PERKS = [
  {
    level: 1,
    name: 'Happy Start',
    description: 'Your pet starts its adventure!',
  },
  {
    level: 3,
    name: 'Dancing Shoes',
    description: 'Your pet can now dance for brain breaks!',
  },
  {
    level: 5,
    name: 'Coin Collector',
    description: 'Double coins from playing!',
  },
  {
    level: 7,
    name: 'Speedster',
    description: 'Play animations are 20% faster!',
  },
  {
    level: 10,
    name: 'Energy Boost',
    description: 'Energy regenerates faster!',
  },
  {
    level: 15,
    name: 'Happiness Aura',
    description: 'Happiness never drops below 50!',
  },
  {
    level: 20,
    name: 'Master of All',
    description: 'Ultimate pet! All stats boost by 10%!',
  },
];

export function getUnlockedPerks(level: number) {
  return PERKS.filter(p => level >= p.level);
}
