# Class Pet - Interactive Classroom Game 🐾

A fun, interactive web-based pet game designed for classrooms K-6. Students can create and care for virtual pets, earn coins through good behavior and completing tasks, and unlock special perks as their pet levels up!

## Features

### 🐾 Multiple Pet Types
- **Dog** - Loyal and playful
- **Cat** - Curious and independent  
- **Unicorn** - Magical and sparkly
- **Dragon** - Fierce and powerful
- **Phoenix** - Majestic and eternal

### 🎮 Interactive Gameplay
- **Feeding** - Keep your pet happy and healthy
- **Playing** - Earn experience points and coins
- **Resting** - Restore energy
- **Dancing** - Fun animations for brain breaks
- **Pet Interactions** - Click to interact with your pet

### 📊 Pet Management
- **Leveling System** - Unlock perks as your pet levels up
- **Stats Tracking** - Happiness, Hunger, Energy monitoring
- **Pet Nicknames** - Name your pet anything you want
- **Multi-Pet Support** - Create and manage multiple pets
- **Inventory System** - Collect items and food

### 🛍️ Shop & Rewards
- **Food Items** - Apples, Pizza, Ice Cream, Burgers
- **Toys** - Balls, Frisbees, Sticks, Rope toys
- **Decorations** - Houses, Beds, Trees, Bowls
- **Cosmetics** - Bow Ties, Crowns, Sunglasses, Collars
- **Coins** - Earn and spend coins in the shop

### ⭐ Unlock Perks
- Level 1: Happy Start
- Level 3: Dancing Shoes (unlock dancing)
- Level 5: Coin Collector (double coins from playing)
- Level 7: Speedster (20% faster play animations)
- Level 10: Energy Boost (faster energy recovery)
- Level 15: Happiness Aura (happiness never below 50)
- Level 20: Master of All (all stats +10%)

### 👨‍🏫 Teacher Dashboard
- Award coins to individual students
- Track class pet progress
- Monitor student engagement
- Customize reward amounts

### 💾 Persistent Storage
- Game data automatically saves to browser
- Continue playing anytime
- Multiple pet saves

## Getting Started

### Installation

```bash
# Clone or download the project
cd class-pet

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173/`

### Building for Production

```bash
npm run build
npm run preview
```

## How to Play

1. **Create Your Pet**
   - Choose a pet type (Dog, Cat, Unicorn, Dragon, or Phoenix)
   - Give your pet a name
   - Your pet starts at Level 1

2. **Care for Your Pet**
   - 🍖 Feed your pet when hungry
   - 🎮 Play to earn experience
   - 😴 Rest to restore energy
   - 💃 Dance for fun brain breaks

3. **Earn Coins & Level Up**
   - Playing earns experience points
   - When you level up, earn bonus coins
   - Use coins in the shop to buy items

4. **Unlock Perks**
   - As your pet levels up, new perks unlock
   - Each perk gives special benefits
   - Check the Perks menu to see what's coming

5. **Visit the Shop**
   - Buy food, toys, decorations, and cosmetics
   - Spend coins to customize your pet's experience
   - Different items provide different benefits

6. **Teacher Controls** (Optional)
   - Open the Teacher panel
   - Award coins to students for good behavior
   - Monitor class progress

## Pet Stats

- **Happiness** ❤️ - Keep high by playing and feeding
- **Hunger** 🍽️ - Increases over time, feed to decrease
- **Energy** ⚡ - Required for playing, recovers through rest
- **Coins** 💰 - Currency for shopping
- **Experience** ✨ - Earned through playing, leads to level ups
- **Level** 🏆 - Increases with experience, unlocks perks

## Customization

### Game Store (`src/store.ts`)
- Modify base stats for new pets
- Adjust rewards and coin amounts
- Customize level thresholds

### Pet Assets (`src/assetGenerator.ts`)
- Pets are dynamically generated as SVG graphics
- Edit colors, shapes, and animations
- No external assets required

### UI (`src/gameUI.ts`)
- Beautiful gradient backgrounds
- Responsive design for all screen sizes
- Smooth animations and transitions

## Technologies Used

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management
- **SVG Graphics** - Dynamically generated pet visuals
- **HTML5 Canvas** - Game rendering

## Project Structure

```
src/
├── main.ts           - Application entry point
├── gameUI.ts         - UI components and rendering
├── store.ts          - State management with Zustand
├── types.ts          - TypeScript type definitions
├── assetGenerator.ts - SVG pet graphics generation
├── gameData.ts       - Game constants and utilities
└── style.css         - Base styles

index.html           - HTML template
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

- Game data is automatically saved every 10 minutes
- Stats decay gradually (hunger increases, happiness decreases)
- Smooth 60fps animations
- Optimized SVG rendering

## Troubleshooting

### Pet not saving?
- Check browser local storage (not disabled)
- Try clearing cache and restarting
- Use a modern browser

### Graphics not showing?
- Ensure JavaScript is enabled
- Try a different browser
- Clear browser cache

### Performance issues?
- Close unnecessary browser tabs
- Disable browser extensions
- Update your browser

## Future Features

- Sound effects and background music
- Multiplayer classroom competitions
- Pet breeding/evolution system
- Custom pet customization
- Achievement badges
- Parent/Guardian dashboard
- Export progress reports

## License

Created for educational purposes. Free to use and modify.

## Contributing

Feel free to customize and extend this game for your classroom needs!

---

**Made with ❤️ for classrooms everywhere** 🎓🐾
