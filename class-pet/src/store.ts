import type { Pet, ClassData } from './types';

interface GameStore {
  // Pet management
  pets: Pet[];
  currentPetId: string | null;
  currentPet: Pet | null;
  
  // Game state
  gameMode: 'pet' | 'shop' | 'teacher' | 'select' | 'stats';
  showMenu: boolean;
  
  // Teacher mode
  isTeacher: boolean;
  classData: ClassData | null;
}

class GameStoreImpl {
  private state: GameStore = {
    pets: [],
    currentPetId: null,
    currentPet: null,
    gameMode: 'select',
    showMenu: false,
    isTeacher: false,
    classData: null,
  };

  private listeners: Set<(state: GameStore) => void> = new Set();
  private readonly storageKey = 'class-pet-store';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.state = { ...this.state, ...data };
      }
    } catch (e) {
      console.warn('Failed to load game state from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save game state to storage:', e);
    }
  }

  subscribe(listener: (state: GameStore) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
    this.saveToStorage();
  }

  getState() {
    return {
      ...this.state,
      // Actions
      setPets: (pets: Pet[]) => {
        this.state.pets = pets;
        this.notify();
      },
      setCurrentPet: (petId: string) => {
        const pet = this.state.pets.find(p => p.id === petId);
        this.state.currentPetId = petId;
        this.state.currentPet = pet || null;
        this.notify();
      },
      updateCurrentPet: (pet: Pet) => {
        const index = this.state.pets.findIndex(p => p.id === pet.id);
        if (index !== -1) {
          this.state.pets[index] = pet;
          this.state.currentPet = pet;
          this.notify();
        }
      },
      addPet: (pet: Pet) => {
        this.state.pets.push(pet);
        this.notify();
      },
      deletePet: (petId: string) => {
        this.state.pets = this.state.pets.filter(p => p.id !== petId);
        if (this.state.currentPetId === petId) {
          this.state.currentPetId = this.state.pets[0]?.id || null;
          this.state.currentPet = this.state.pets[0] || null;
        }
        this.notify();
      },
      setGameMode: (mode: 'pet' | 'shop' | 'teacher' | 'select' | 'stats') => {
        this.state.gameMode = mode;
        this.notify();
      },
      setShowMenu: (show: boolean) => {
        this.state.showMenu = show;
        this.notify();
      },
      setIsTeacher: (isTeacher: boolean) => {
        this.state.isTeacher = isTeacher;
        this.notify();
      },
      setClassData: (classData: ClassData | null) => {
        this.state.classData = classData;
        this.notify();
      },
      feedPet: (petId: string) => {
        const pet = this.state.pets.find(p => p.id === petId);
        if (pet) {
          const updated = {
            ...pet,
            hunger: Math.max(0, pet.hunger - 30),
            happiness: Math.min(100, pet.happiness + 10),
            lastFedAt: Date.now(),
          };
          if (pet.id === this.state.currentPetId) {
            this.getState().updateCurrentPet(updated);
          } else {
            const index = this.state.pets.findIndex(p => p.id === petId);
            if (index !== -1) {
              this.state.pets[index] = updated;
              this.notify();
            }
          }
        }
      },
      playWithPet: (petId: string) => {
        const pet = this.state.pets.find(p => p.id === petId);
        if (pet && pet.energy > 10) {
          let updated = {
            ...pet,
            energy: Math.max(0, pet.energy - 20),
            happiness: Math.min(100, pet.happiness + 25),
            experience: pet.experience + 15,
            lastPlayedAt: Date.now(),
          };
          
          const levelExp = (updated.level + 1) * 100;
          if (updated.experience >= levelExp) {
            updated.level += 1;
            updated.experience = 0;
            updated.coins = Math.min(999, updated.coins + 50);
          }
          
          if (pet.id === this.state.currentPetId) {
            this.getState().updateCurrentPet(updated);
          } else {
            const index = this.state.pets.findIndex(p => p.id === petId);
            if (index !== -1) {
              this.state.pets[index] = updated;
              this.notify();
            }
          }
        }
      },
      restPet: (petId: string) => {
        const pet = this.state.pets.find(p => p.id === petId);
        if (pet) {
          const updated = {
            ...pet,
            energy: Math.min(100, pet.energy + 40),
            happiness: Math.min(100, pet.happiness + 5),
          };
          if (pet.id === this.state.currentPetId) {
            this.getState().updateCurrentPet(updated);
          } else {
            const index = this.state.pets.findIndex(p => p.id === petId);
            if (index !== -1) {
              this.state.pets[index] = updated;
              this.notify();
            }
          }
        }
      },
      addExperience: (petId: string, amount: number) => {
        const pet = this.state.pets.find(p => p.id === petId);
        if (pet) {
          let updated = { ...pet, experience: pet.experience + amount };
          
          const levelExp = (updated.level + 1) * 100;
          if (updated.experience >= levelExp) {
            updated.level += 1;
            updated.experience = 0;
            updated.coins = Math.min(999, updated.coins + 50);
          }
          
          if (pet.id === this.state.currentPetId) {
            this.getState().updateCurrentPet(updated);
          } else {
            const index = this.state.pets.findIndex(p => p.id === petId);
            if (index !== -1) {
              this.state.pets[index] = updated;
              this.notify();
            }
          }
        }
      },
      addCoins: (petId: string, amount: number) => {
        const pet = this.state.pets.find(p => p.id === petId);
        if (pet) {
          const updated = { ...pet, coins: Math.min(9999, pet.coins + amount) };
          if (pet.id === this.state.currentPetId) {
            this.getState().updateCurrentPet(updated);
          } else {
            const index = this.state.pets.findIndex(p => p.id === petId);
            if (index !== -1) {
              this.state.pets[index] = updated;
              this.notify();
            }
          }
        }
      },
      rewardStudent: (petId: string, coins: number) => {
        this.getState().addCoins(petId, coins);
        if (this.state.classData) {
          this.state.classData.totalCoinsDistributed += coins;
          this.notify();
        }
      },
    };
  }
}

const storeInstance = new GameStoreImpl();

export const useGameStore = {
  getState: () => storeInstance.getState(),
  subscribe: (listener: (state: GameStore) => void) => storeInstance.subscribe(listener),
};
