import type { PetType } from './types';

export class PetAssetGenerator {
  static generatePetSVG(petType: PetType, scale: number = 1): string {
    const baseSize = 200;
    const size = baseSize * scale;

    const pets: Record<PetType, string> = {
      dog: this.generateDog(size),
      cat: this.generateCat(size),
      unicorn: this.generateUnicorn(size),
      dragon: this.generateDragon(size),
      phoenix: this.generatePhoenix(size),
      trex: this.generateDog(size), // Fallback
      triceratops: this.generateCat(size), // Fallback
      stegosaurus: this.generateUnicorn(size), // Fallback
      pterodactyl: this.generateDragon(size), // Fallback
    };

    return pets[petType];
  }

  private static generateDog(size: number): string {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .dog-body { fill: #D4A574; stroke: #8B6F47; stroke-width: 2; }
          .dog-head { fill: #C9956B; stroke: #8B6F47; stroke-width: 2; }
          .dog-ear { fill: #8B6F47; stroke: #5C4A2A; stroke-width: 1.5; }
          .dog-eye { fill: #000; }
          .dog-nose { fill: #5C4A2A; }
          .dog-mouth { fill: none; stroke: #5C4A2A; stroke-width: 2; stroke-linecap: round; }
          .dog-tail { fill: #C9956B; stroke: #8B6F47; stroke-width: 2; }
          .dog-spot { fill: #8B6F47; opacity: 0.6; }
          @keyframes wag {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(15deg); }
          }
          .dog-tail-anim { animation: wag 0.6s infinite; transform-origin: 60px 70px; }
        </style>
      </defs>
      <!-- Tail -->
      <ellipse class="dog-tail dog-tail-anim" cx="60" cy="90" rx="12" ry="35" transform="rotate(-20)"/>
      <!-- Back legs -->
      <rect class="dog-body" x="45" y="130" width="15" height="40" rx="7"/>
      <rect class="dog-body" x="80" y="130" width="15" height="40" rx="7"/>
      <!-- Body -->
      <ellipse class="dog-body" cx="100" cy="90" rx="50" ry="45"/>
      <!-- Spots -->
      <circle class="dog-spot" cx="120" cy="75" r="12"/>
      <circle class="dog-spot" cx="75" cy="85" r="10"/>
      <!-- Front legs -->
      <rect class="dog-body" x="65" y="130" width="15" height="40" rx="7"/>
      <rect class="dog-body" x="110" y="130" width="15" height="40" rx="7"/>
      <!-- Neck -->
      <ellipse class="dog-head" cx="100" cy="50" rx="35" ry="40"/>
      <!-- Head -->
      <circle class="dog-head" cx="100" cy="35" r="38"/>
      <!-- Ears -->
      <ellipse class="dog-ear" cx="75" cy="10" rx="14" ry="20" transform="rotate(-25 75 10)"/>
      <ellipse class="dog-ear" cx="125" cy="10" rx="14" ry="20" transform="rotate(25 125 10)"/>
      <!-- Inner ears -->
      <ellipse fill="#E8B89F" cx="75" cy="15" rx="8" ry="12" transform="rotate(-25 75 15)"/>
      <ellipse fill="#E8B89F" cx="125" cy="15" rx="8" ry="12" transform="rotate(25 125 15)"/>
      <!-- Eyes -->
      <circle class="dog-eye" cx="85" cy="28" r="5"/>
      <circle class="dog-eye" cx="115" cy="28" r="5"/>
      <circle fill="#FFF" cx="87" cy="26" r="2.5"/>
      <circle fill="#FFF" cx="117" cy="26" r="2.5"/>
      <!-- Nose -->
      <ellipse class="dog-nose" cx="100" cy="42" rx="6" ry="5"/>
      <!-- Mouth -->
      <path class="dog-mouth" d="M 100 42 L 100 50 M 95 48 Q 95 52 100 52 Q 105 52 105 48"/>
      <!-- Tongue -->
      <ellipse fill="#FF6B9D" cx="100" cy="55" rx="5" ry="4"/>
    </svg>`;
  }

  private static generateCat(size: number): string {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .cat-body { fill: #FF9D5C; stroke: #E67E22; stroke-width: 2; }
          .cat-head { fill: #FFB380; stroke: #E67E22; stroke-width: 2; }
          .cat-eye { fill: #32CD32; stroke: #000; stroke-width: 1; }
          .cat-pupil { fill: #000; }
          .cat-nose { fill: #FFB6C1; stroke: #E67E22; stroke-width: 1; }
          .cat-mouth { fill: none; stroke: #E67E22; stroke-width: 2; stroke-linecap: round; }
          .cat-ear { fill: #FFB380; stroke: #E67E22; stroke-width: 2; }
          .cat-tail { fill: #FF9D5C; stroke: #E67E22; stroke-width: 2; }
          @keyframes sway {
            0%, 100% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
          }
          .cat-tail-anim { animation: sway 1s infinite; transform-origin: 50px 70px; }
        </style>
      </defs>
      <!-- Tail -->
      <path class="cat-tail cat-tail-anim" d="M 50 80 Q 20 100 30 150 Q 35 160 45 155"/>
      <!-- Back legs -->
      <rect class="cat-body" x="45" y="135" width="12" height="35" rx="6"/>
      <rect class="cat-body" x="85" y="135" width="12" height="35" rx="6"/>
      <!-- Body -->
      <ellipse class="cat-body" cx="100" cy="95" rx="45" ry="50"/>
      <!-- Front legs -->
      <rect class="cat-body" x="70" y="135" width="12" height="35" rx="6"/>
      <rect class="cat-body" x="110" y="135" width="12" height="35" rx="6"/>
      <!-- Head -->
      <circle class="cat-head" cx="100" cy="40" r="40"/>
      <!-- Left ear -->
      <polygon class="cat-ear" points="70,5 60,35 80,25"/>
      <!-- Right ear -->
      <polygon class="cat-ear" points="130,5 140,35 120,25"/>
      <!-- Inner ear left -->
      <polygon fill="#FFB6C1" points="70,10 65,30 75,22"/>
      <!-- Inner ear right -->
      <polygon fill="#FFB6C1" points="130,10 135,30 125,22"/>
      <!-- Eyes -->
      <ellipse class="cat-eye" cx="82" cy="32" rx="7" ry="12"/>
      <ellipse class="cat-eye" cx="118" cy="32" rx="7" ry="12"/>
      <!-- Pupils -->
      <circle class="cat-pupil" cx="82" cy="38" r="3"/>
      <circle class="cat-pupil" cx="118" cy="38" r="3"/>
      <!-- Shine in eyes -->
      <circle fill="#FFF" cx="84" cy="35" r="2"/>
      <circle fill="#FFF" cx="120" cy="35" r="2"/>
      <!-- Nose -->
      <polygon class="cat-nose" points="100,48 95,55 105,55"/>
      <!-- Mouth -->
      <path class="cat-mouth" d="M 100 55 L 100 62"/>
      <path class="cat-mouth" d="M 95 58 Q 90 60 85 58"/>
      <path class="cat-mouth" d="M 105 58 Q 110 60 115 58"/>
      <!-- Whiskers -->
      <line stroke="#E67E22" stroke-width="1.5" x1="55" y1="45" x2="30" y2="42"/>
      <line stroke="#E67E22" stroke-width="1.5" x1="55" y1="55" x2="25" y2="58"/>
      <line stroke="#E67E22" stroke-width="1.5" x1="145" y1="45" x2="170" y2="42"/>
      <line stroke="#E67E22" stroke-width="1.5" x1="145" y1="55" x2="175" y2="58"/>
    </svg>`;
  }

  private static generateUnicorn(size: number): string {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .unicorn-body { fill: #FFB6E8; stroke: #E0A5D4; stroke-width: 2; }
          .unicorn-head { fill: #FFC9F0; stroke: #E0A5D4; stroke-width: 2; }
          .unicorn-horn { fill: url(#hornGradient); stroke: #FFD700; stroke-width: 1.5; }
          .unicorn-eye { fill: #9370DB; stroke: #000; stroke-width: 1; }
          .unicorn-mane { fill: #FFB6E8; stroke: #E0A5D4; stroke-width: 1.5; }
          @keyframes bounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .unicorn-bounce { animation: bounce 0.8s infinite; }
        </style>
        <linearGradient id="hornGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FF69B4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Back legs -->
      <rect class="unicorn-body" x="45" y="130" width="13" height="40" rx="6.5"/>
      <rect class="unicorn-body" x="85" y="130" width="13" height="40" rx="6.5"/>
      <!-- Body -->
      <ellipse class="unicorn-body unicorn-bounce" cx="100" cy="90" rx="50" ry="45"/>
      <!-- Front legs -->
      <rect class="unicorn-body" x="65" y="130" width="13" height="40" rx="6.5"/>
      <rect class="unicorn-body" x="105" y="130" width="13" height="40" rx="6.5"/>
      <!-- Neck -->
      <ellipse class="unicorn-head" cx="100" cy="50" rx="32" ry="38"/>
      <!-- Head -->
      <circle class="unicorn-head" cx="100" cy="30" r="38"/>
      <!-- Horn -->
      <polygon class="unicorn-horn" points="100,0 95,30 105,30"/>
      <!-- Horn shine -->
      <polygon fill="#FFFF99" opacity="0.7" points="101,5 99,25 102,25"/>
      <!-- Mane -->
      <ellipse class="unicorn-mane" cx="85" cy="15" rx="10" ry="16"/>
      <ellipse class="unicorn-mane" cx="115" cy="15" rx="10" ry="16"/>
      <!-- Eyes -->
      <circle class="unicorn-eye" cx="85" cy="25" r="5"/>
      <circle class="unicorn-eye" cx="115" cy="25" r="5"/>
      <circle fill="#FFF" cx="87" cy="23" r="2"/>
      <circle fill="#FFF" cx="117" cy="23" r="2"/>
      <!-- Nose -->
      <ellipse fill="#FFD6EE" cx="100" cy="40" rx="5" ry="4" stroke="#E0A5D4" stroke-width="1"/>
      <!-- Mouth -->
      <path fill="none" stroke="#E0A5D4" stroke-width="1.5" stroke-linecap="round" d="M 100 40 Q 98 45 95 44"/>
      <!-- Tail -->
      <path fill="none" stroke="#FFB6E8" stroke-width="5" stroke-linecap="round" d="M 50 80 Q 25 100 30 150"/>
      <!-- Tail strands -->
      <path fill="none" stroke="#FFB6E8" stroke-width="3" stroke-linecap="round" opacity="0.7" d="M 50 82 Q 20 105 25 155"/>
      <path fill="none" stroke="#FFB6E8" stroke-width="3" stroke-linecap="round" opacity="0.7" d="M 50 78 Q 30 95 35 145"/>
    </svg>`;
  }

  private static generateDragon(size: number): string {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .dragon-body { fill: #4A90E2; stroke: #2E5C8A; stroke-width: 2; }
          .dragon-head { fill: #5BA3F5; stroke: #2E5C8A; stroke-width: 2; }
          .dragon-eye { fill: #FFD700; stroke: #000; stroke-width: 1; }
          .dragon-wing { fill: #6BB6FF; stroke: #2E5C8A; stroke-width: 1.5; opacity: 0.8; }
          .dragon-fire { fill: #FF6B35; }
          @keyframes flap {
            0%, 100% { transform: rotateY(0deg); }
            50% { transform: rotateY(-15deg); }
          }
          .dragon-wing-left { animation: flap 0.6s infinite; transform-origin: 65px 80px; }
        </style>
      </defs>
      <!-- Back legs -->
      <ellipse class="dragon-body" cx="50" cy="145" rx="10" ry="22"/>
      <ellipse class="dragon-body" cx="80" cy="150" rx="10" ry="20"/>
      <!-- Body -->
      <ellipse class="dragon-body" cx="100" cy="95" rx="48" ry="42"/>
      <!-- Front legs -->
      <ellipse class="dragon-body" cx="120" cy="150" rx="10" ry="20"/>
      <ellipse class="dragon-body" cx="150" cy="145" rx="10" ry="22"/>
      <!-- Spikes on back -->
      <polygon class="dragon-body" points="75,50 70,35 80,50"/>
      <polygon class="dragon-body" points="100,45 95,25 105,45"/>
      <polygon class="dragon-body" points="125,50 120,35 130,50"/>
      <!-- Wings -->
      <ellipse class="dragon-wing dragon-wing-left" cx="60" cy="80" rx="25" ry="35" transform="skewY(-20)"/>
      <ellipse class="dragon-wing" cx="140" cy="80" rx="25" ry="35" transform="skewY(20)"/>
      <!-- Head -->
      <circle class="dragon-head" cx="100" cy="35" r="35"/>
      <!-- Horns -->
      <polygon class="dragon-head" points="80,8 75,0 85,10"/>
      <polygon class="dragon-head" points="120,8 125,0 115,10"/>
      <!-- Eyes -->
      <circle class="dragon-eye" cx="88" cy="30" r="5"/>
      <circle class="dragon-eye" cx="112" cy="30" r="5"/>
      <circle class="dragon-fire" cx="88" cy="30" r="2.5"/>
      <circle class="dragon-fire" cx="112" cy="30" r="2.5"/>
      <!-- Nostrils -->
      <circle fill="#2E5C8A" cx="95" cy="42" r="2"/>
      <circle fill="#2E5C8A" cx="105" cy="42" r="2"/>
      <!-- Mouth -->
      <path fill="none" stroke="#2E5C8A" stroke-width="2" stroke-linecap="round" d="M 100 45 L 100 55"/>
      <!-- Tail -->
      <path fill="none" stroke="#4A90E2" stroke-width="8" stroke-linecap="round" d="M 50 90 Q 20 100 15 150"/>
      <!-- Fire breath -->
      <circle class="dragon-fire" cx="95" cy="55" r="4" opacity="0.7"/>
      <circle class="dragon-fire" cx="90" cy="60" r="3" opacity="0.5"/>
      <circle class="dragon-fire" cx="100" cy="60" r="3" opacity="0.5"/>
    </svg>`;
  }

  private static generatePhoenix(size: number): string {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .phoenix-body { fill: #FF6B35; stroke: #C41E3A; stroke-width: 2; }
          .phoenix-head { fill: #FF8C42; stroke: #C41E3A; stroke-width: 2; }
          .phoenix-eye { fill: #FFD700; stroke: #000; stroke-width: 1; }
          .phoenix-flame { fill: #FFD700; filter: drop-shadow(0 0 3px #FF6B35); }
          .phoenix-wing { fill: #FF8C42; stroke: #C41E3A; stroke-width: 1.5; opacity: 0.9; }
          @keyframes rise {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          .phoenix-rise { animation: rise 1s infinite; }
        </style>
      </defs>
      <!-- Flame aura -->
      <circle class="phoenix-flame" cx="100" cy="100" r="55" opacity="0.2"/>
      <!-- Tail feathers (long) -->
      <path fill="#FF6B35" stroke="#C41E3A" stroke-width="2" d="M 50 90 Q 20 80 10 120 Q 15 125 30 115 Q 40 105 50 95"/>
      <path fill="#FF8C42" stroke="#C41E3A" stroke-width="2" d="M 45 100 Q 10 95 0 140 Q 5 143 25 130 Q 40 115 45 105"/>
      <!-- Back legs -->
      <rect class="phoenix-body" x="45" y="140" width="10" height="25" rx="5"/>
      <rect class="phoenix-body" x="85" y="140" width="10" height="25" rx="5"/>
      <!-- Body -->
      <ellipse class="phoenix-body phoenix-rise" cx="100" cy="90" rx="42" ry="40"/>
      <!-- Front legs -->
      <rect class="phoenix-body" x="65" y="140" width="10" height="25" rx="5"/>
      <rect class="phoenix-body" x="105" y="140" width="10" height="25" rx="5"/>
      <!-- Wings -->
      <ellipse class="phoenix-wing" cx="65" cy="75" rx="22" ry="38" transform="rotate(-25 65 75)"/>
      <ellipse class="phoenix-wing" cx="135" cy="75" rx="22" ry="38" transform="rotate(25 135 75)"/>
      <!-- Wing flame edges -->
      <circle class="phoenix-flame" cx="50" cy="60" r="6" opacity="0.6"/>
      <circle class="phoenix-flame" cx="150" cy="60" r="6" opacity="0.6"/>
      <!-- Head -->
      <circle class="phoenix-head" cx="100" cy="40" r="32"/>
      <!-- Crest feathers -->
      <polygon class="phoenix-flame" points="85,10 80,5 85,20"/>
      <polygon class="phoenix-flame" points="100,5 95,0 100,15"/>
      <polygon class="phoenix-flame" points="115,10 120,5 115,20"/>
      <!-- Eyes -->
      <circle class="phoenix-eye" cx="88" cy="35" r="4"/>
      <circle class="phoenix-eye" cx="112" cy="35" r="4"/>
      <circle fill="#000" cx="88" cy="35" r="2"/>
      <circle fill="#000" cx="112" cy="35" r="2"/>
      <!-- Beak -->
      <polygon fill="#FFD700" points="100,45 106,50 100,52 94,50"/>
      <!-- Flame marks on body -->
      <circle class="phoenix-flame" cx="90" cy="90" r="4" opacity="0.5"/>
      <circle class="phoenix-flame" cx="110" cy="85" r="5" opacity="0.5"/>
    </svg>`;
  }

  static getPetColor(petType: PetType): string {
    const colors: Record<PetType, string> = {
      dog: '#D4A574',
      cat: '#FF9D5C',
      unicorn: '#FFB6E8',
      dragon: '#4A90E2',
      phoenix: '#FF6B35',
      trex: '#8B4513',
      triceratops: '#8B7355',
      stegosaurus: '#9B6B47',
      pterodactyl: '#9F7F5F',
    };
    return colors[petType];
  }

  static getPetName(petType: PetType): string {
    const names: Record<PetType, string> = {
      dog: 'Puppy',
      cat: 'Kitten',
      unicorn: 'Sparkle',
      dragon: 'Drake',
      phoenix: 'Blaze',
      trex: 'Rex',
      triceratops: 'Trixie',
      stegosaurus: 'Stegie',
      pterodactyl: 'Petty',
    };
    return names[petType];
  }
}
