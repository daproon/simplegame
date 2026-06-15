import type { Pet, PetType } from './types';
import { useGameStore } from './store';
import { createNewPet, PET_TYPES, SHOP_ITEMS, getPetDescription, getUnlockedPerks, calculateStats } from './gameData';
import { Pet3DRenderer } from './pet3DRenderer';
import type { PetAnimation } from './pet3DRenderer';
import { SoundEffects } from './soundEffects';

export class GameUI {
  private container: HTMLElement;
  private store = useGameStore;
  private pet3DRenderer: Pet3DRenderer | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) || document.body;
    this.setupStyles();
    SoundEffects.initialize();
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;600;800&display=swap');

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Exo 2', 'Arial', sans-serif;
        background: #080d1f;
        min-height: 100vh;
        overflow: hidden;
      }

      #app {
        width: 100%; height: 100vh;
        display: flex; align-items: center; justify-content: center;
      }

      /* ── Keyframes ─────────────────────────────────────── */
      @keyframes float-up {
        to { transform: translateY(-110px) scale(1.4); opacity: 0; }
      }
      @keyframes hud-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(100, 200, 255, 0); }
        50%       { box-shadow: 0 0 22px 4px rgba(100, 200, 255, 0.18); }
      }
      @keyframes orb-drift {
        0%   { transform: translate(0, 0) scale(1); opacity: 0.55; }
        50%  { transform: translate(30px, -40px) scale(1.12); opacity: 0.35; }
        100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
      }
      @keyframes orb-drift2 {
        0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
        50%  { transform: translate(-40px, 30px) scale(1.08); opacity: 0.22; }
        100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      }
      @keyframes bar-glow {
        0%, 100% { filter: brightness(1); }
        50%       { filter: brightness(1.35) drop-shadow(0 0 5px currentColor); }
      }
      @keyframes combo-pop {
        0%   { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
        30%  { transform: translate(-50%, -20px) scale(1.25); opacity: 1; }
        70%  { transform: translate(-50%, -34px) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -60px) scale(0.9); opacity: 0; }
      }
      @keyframes cooldown-ring {
        from { stroke-dashoffset: 100; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes badge-glow {
        0%, 100% { text-shadow: 0 0 10px rgba(255,215,0,0.5); }
        50%       { text-shadow: 0 0 22px rgba(255,215,0,0.9), 0 0 40px rgba(255,165,0,0.5); }
      }
      @keyframes xp-shine {
        from { background-position: -200% center; }
        to   { background-position: 200% center; }
      }
      @keyframes pulse-scale {
        0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50%  { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }

      /* ── Background ────────────────────────────────────── */
      .main-view {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: flex-start;
        background: linear-gradient(160deg, #0a1028 0%, #14204c 50%, #2a1a5e 100%);
        position: relative; overflow: hidden;
      }
      .bg-orb {
        position: absolute; border-radius: 50%;
        pointer-events: none; z-index: 0;
      }
      .bg-orb-1 {
        width: 520px; height: 520px; left: -120px; top: -80px;
        background: radial-gradient(circle, rgba(70,130,255,0.22) 0%, transparent 70%);
        animation: orb-drift 14s ease-in-out infinite;
      }
      .bg-orb-2 {
        width: 400px; height: 400px; right: -80px; bottom: 40px;
        background: radial-gradient(circle, rgba(160,80,255,0.18) 0%, transparent 70%);
        animation: orb-drift2 18s ease-in-out infinite;
      }
      .bg-orb-3 {
        width: 280px; height: 280px; right: 30%; top: 20%;
        background: radial-gradient(circle, rgba(0,210,220,0.10) 0%, transparent 70%);
        animation: orb-drift 22s ease-in-out infinite reverse;
      }

      /* ── HUD Top ───────────────────────────────────────── */
      .hud-top {
        width: min(1220px, 95vw);
        margin-top: 16px;
        padding: 12px 18px;
        border-radius: 18px;
        background: linear-gradient(140deg, rgba(9,16,44,0.85), rgba(20,38,82,0.65));
        border: 1px solid rgba(120,196,255,0.32);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.04),
                    0 16px 40px rgba(4,10,32,0.55);
        backdrop-filter: blur(14px);
        animation: hud-pulse 4s ease-in-out infinite;
        position: relative; z-index: 2;
      }

      .hud-title-row {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 12px;
      }
      .pet-name-display {
        font-family: 'Rajdhani', 'Arial', sans-serif;
        font-size: 32px; font-weight: 700; letter-spacing: 1px;
        color: #e8f4ff;
        text-shadow: 0 0 18px rgba(120,200,255,0.5);
      }
      .level-badge {
        display: flex; align-items: center; gap: 8px;
        background: linear-gradient(120deg, rgba(255,185,0,0.18), rgba(255,120,0,0.14));
        border: 1px solid rgba(255,185,0,0.45);
        border-radius: 24px; padding: 5px 14px;
        font-weight: 700; font-size: 13px; color: #ffd84d;
        animation: badge-glow 2.5s ease-in-out infinite;
      }
      .xp-row { margin-bottom: 0; }
      .xp-label {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
        color: rgba(180,220,255,0.7); margin-bottom: 4px;
      }
      .xp-bar-wrap {
        width: 100%; height: 6px;
        background: rgba(0,0,0,0.4);
        border-radius: 3px; overflow: hidden; margin-bottom: 12px;
      }
      .xp-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #4facfe, #00f2fe, #4facfe);
        background-size: 200% auto;
        border-radius: 3px;
        animation: xp-shine 2.5s linear infinite;
        transition: width 0.5s ease;
      }

      /* ── Pet stats ─────────────────────────────────────── */
      .pet-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }
      .stat-bar {
        background: linear-gradient(145deg, rgba(20,34,75,0.7), rgba(14,22,52,0.5));
        border-radius: 12px; padding: 9px 12px;
        color: white; font-weight: 700;
        border: 1px solid rgba(140,220,255,0.18);
        backdrop-filter: blur(6px);
      }
      .stat-label {
        font-size: 10px; opacity: 0.85; margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: 0.4px;
        color: rgba(190,225,255,0.9);
      }
      .progress-bar {
        width: 100%; height: 9px;
        background: rgba(0,0,0,0.4); border-radius: 5px; overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #FFD700, #FFA500);
        border-radius: 4px;
        transition: width 0.4s ease;
        animation: bar-glow 3s ease-in-out infinite;
      }
      .coins-value {
        font-size: 22px; font-weight: 800;
        text-align: center; color: #ffd84d;
        text-shadow: 0 0 12px rgba(255,200,0,0.5);
      }

      /* ── Battle stage ──────────────────────────────────── */
      .battle-stage {
        width: min(1220px, 95vw);
        height: calc(100vh - 205px);
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 170px;
        gap: 16px;
        align-items: stretch;
        position: relative; z-index: 2;
      }

      .pet-display {
        text-align: center; flex: 1;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        width: 100%;
      }

      /* ── Pet avatar stage ──────────────────────────────── */
      .pet-avatar {
        width: 100%; height: 100%; min-height: 420px;
        background: #010510;
        border-radius: 22px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 40px rgba(40,120,255,0.08),
                    0 26px 64px rgba(6,9,32,0.6),
                    inset 0 0 0 1px rgba(140,210,255,0.14);
        border: 1px solid rgba(140,210,255,0.20);
        cursor: pointer;
        transition: border-color 0.3s, box-shadow 0.3s;
        position: relative; overflow: hidden;
      }
      .pet-avatar:hover {
        border-color: rgba(140,210,255,0.42);
        box-shadow: 0 0 55px rgba(60,160,255,0.16),
                    0 30px 70px rgba(7,11,36,0.65),
                    inset 0 0 0 1px rgba(180,232,255,0.22);
      }
      .pet-avatar canvas { width: 100%; height: 100%; display: block; }
      .pet-avatar svg { width: 240px; height: 240px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }

      .dragon-sneeze-fx {
        position: absolute;
        z-index: 6;
        left: 50%;
        top: 53%;
        width: 1px;
        height: 1px;
        pointer-events: none;
        transform: translate(-50%, -50%);
      }
      .dragon-sneeze-fx.tiny-fx {
        transform: translate(-50%, -50%) scale(0.52);
      }

      .dragon-sneeze-ring {
        position: absolute;
        left: 0;
        top: 0;
        width: 34px;
        height: 22px;
        margin: -11px 0 0 -17px;
        border: 2px solid rgba(255,218,145,0.7);
        border-radius: 50%;
        filter: drop-shadow(0 0 8px rgba(255,145,45,0.65));
        animation: dragon-sneeze-ring 0.55s ease-out forwards;
      }

      .dragon-smoke-puff {
        position: absolute;
        left: 0;
        top: 0;
        width: var(--size);
        height: var(--size);
        margin-left: calc(var(--size) / -2);
        margin-top: calc(var(--size) / -2);
        border-radius: 50%;
        background:
          radial-gradient(circle at 35% 32%, rgba(245,248,255,0.92), rgba(175,185,205,0.72) 42%, rgba(76,79,100,0.18) 72%, transparent 74%);
        filter: blur(1px) drop-shadow(0 0 7px rgba(190,205,235,0.28));
        animation: dragon-smoke-puff 1.15s var(--delay) cubic-bezier(.16,.72,.32,1) forwards;
        opacity: 0;
      }

      .dragon-sneeze-spark {
        position: absolute;
        left: 0;
        top: 0;
        width: 5px;
        height: 12px;
        margin: -6px 0 0 -2px;
        border-radius: 50%;
        background: linear-gradient(to top, #ff6a00, #ffd54a 58%, #fff7ba);
        box-shadow: 0 0 8px #ff7a00, 0 0 14px rgba(255,210,70,0.7);
        transform: rotate(var(--rotation));
        animation: dragon-sneeze-spark 0.72s var(--delay) ease-out forwards;
        opacity: 0;
      }

      @keyframes dragon-sneeze-ring {
        0% { transform: scale(0.25); opacity: 0.9; }
        100% { transform: scale(4.2); opacity: 0; }
      }

      @keyframes dragon-smoke-puff {
        0% { transform: translate(0, 0) scale(0.2); opacity: 0; }
        12% { opacity: 0.9; }
        100% {
          transform: translate(var(--dx), var(--dy)) scale(1.85);
          opacity: 0;
        }
      }

      @keyframes dragon-sneeze-spark {
        0% { transform: translate(0, 0) rotate(var(--rotation)) scale(0.4); opacity: 0; }
        12% { opacity: 1; }
        100% {
          transform: translate(var(--dx), var(--dy)) rotate(var(--rotation)) scale(0.1);
          opacity: 0;
        }
      }

      /* ── Fantasy background ────────────────────────────── */
      .fantasy-bg {
        position: absolute; inset: 0; z-index: 0;
        overflow: hidden;
        --motion-duration: 2.7s;
        perspective: 900px;
        background: linear-gradient(to bottom,
          #010510 0%, #060c28 25%, #0d0b32 48%, #171536 62%, #0a0a18 100%);
      }

      /* Stars: two offset dot grids at different sizes for depth */
      .fbg-stars {
        position: absolute; inset: 0;
        background-image:
          radial-gradient(1.2px 1.2px at 5% 10%, rgba(255,255,255,0.85), transparent),
          radial-gradient(1px 1px at 14% 4%, rgba(200,230,255,0.75), transparent),
          radial-gradient(1.4px 1.4px at 23% 17%, rgba(255,255,255,0.90), transparent),
          radial-gradient(1px 1px at 35% 7%, rgba(180,210,255,0.65), transparent),
          radial-gradient(1.2px 1.2px at 47% 14%, rgba(255,255,255,0.80), transparent),
          radial-gradient(1px 1px at 58% 3%, rgba(220,200,255,0.70), transparent),
          radial-gradient(1.4px 1.4px at 68% 19%, rgba(255,255,255,0.90), transparent),
          radial-gradient(1px 1px at 79% 8%, rgba(200,240,255,0.75), transparent),
          radial-gradient(1.2px 1.2px at 88% 15%, rgba(255,255,255,0.80), transparent),
          radial-gradient(1px 1px at 96% 5%, rgba(210,200,255,0.65), transparent),
          radial-gradient(1px 1px at 9% 28%, rgba(255,255,255,0.60), transparent),
          radial-gradient(1.2px 1.2px at 19% 35%, rgba(200,220,255,0.70), transparent),
          radial-gradient(1px 1px at 32% 26%, rgba(255,255,255,0.55), transparent),
          radial-gradient(1.4px 1.4px at 52% 32%, rgba(255,255,255,0.80), transparent),
          radial-gradient(1px 1px at 72% 29%, rgba(220,210,255,0.65), transparent),
          radial-gradient(1.2px 1.2px at 85% 38%, rgba(255,255,255,0.70), transparent),
          radial-gradient(1px 1px at 41% 44%, rgba(200,230,255,0.55), transparent),
          radial-gradient(1.4px 1.4px at 63% 41%, rgba(255,255,255,0.75), transparent);
        background-size: 100% 100%;
      }

      /* Nebula: coloured glow blobs */
      .fbg-nebula {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse 40% 25% at 25% 35%, rgba(100,20,180,0.18), transparent),
          radial-gradient(ellipse 35% 20% at 72% 20%, rgba(20,80,180,0.14), transparent),
          radial-gradient(ellipse 30% 18% at 50% 55%, rgba(140,20,100,0.10), transparent);
        animation: orb-drift 18s ease-in-out infinite;
      }

      .fbg-moon {
        position: absolute; top: 8%; right: 10%;
        width: 17%; aspect-ratio: 1;
        border-radius: 50%;
        background:
          radial-gradient(circle at 34% 30%, rgba(255,255,255,0.96) 0 4%, transparent 5%),
          radial-gradient(circle at 63% 58%, rgba(86,105,155,0.18) 0 11%, transparent 12%),
          radial-gradient(circle at 40% 72%, rgba(80,95,140,0.14) 0 8%, transparent 9%),
          radial-gradient(circle at 42% 38%, #eef5ff 0 48%, #b7c9ef 70%, #7186bd 100%);
        box-shadow:
          0 0 18px rgba(185,215,255,0.65),
          0 0 55px rgba(105,145,235,0.38),
          0 0 100px rgba(90,80,210,0.2);
        opacity: 0.9;
      }

      .fbg-clouds {
        position: absolute; inset: 8% -35% 35% -35%;
        opacity: 0.22;
        filter: blur(9px);
        background:
          radial-gradient(ellipse 18% 8% at 18% 42%, rgba(185,205,245,0.8), transparent 72%),
          radial-gradient(ellipse 24% 9% at 48% 58%, rgba(155,170,225,0.7), transparent 72%),
          radial-gradient(ellipse 20% 7% at 78% 32%, rgba(180,190,235,0.75), transparent 72%);
        animation: fantasy-cloud-drift 42s linear infinite;
      }

      .fbg-haze {
        position: absolute; inset: 38% 0 16% 0;
        background:
          linear-gradient(to bottom, transparent, rgba(115,105,180,0.08) 40%, transparent),
          radial-gradient(ellipse at 48% 75%, rgba(135,90,190,0.2), transparent 65%);
        filter: blur(5px);
        animation: fantasy-haze-breathe 12s ease-in-out infinite alternate;
      }

      .fbg-fireflies {
        position: absolute; inset: 52% 0 8% 0;
        background-image:
          radial-gradient(circle at 8% 66%, rgba(190,245,190,0.95) 0 1px, transparent 2px),
          radial-gradient(circle at 18% 35%, rgba(160,225,255,0.8) 0 1px, transparent 2px),
          radial-gradient(circle at 31% 76%, rgba(220,255,175,0.9) 0 1px, transparent 2px),
          radial-gradient(circle at 46% 48%, rgba(165,225,255,0.85) 0 1px, transparent 2px),
          radial-gradient(circle at 62% 70%, rgba(220,250,180,0.85) 0 1px, transparent 2px),
          radial-gradient(circle at 76% 38%, rgba(175,230,255,0.9) 0 1px, transparent 2px),
          radial-gradient(circle at 91% 62%, rgba(220,255,175,0.85) 0 1px, transparent 2px);
        filter: drop-shadow(0 0 4px rgba(180,235,255,0.9));
        animation: fantasy-fireflies 5.5s ease-in-out infinite alternate;
      }

      /* Mountain layers — contain scroll-animating SVGs */
      .fbg-mtn-far,
      .fbg-mtn-near,
      .fbg-trees {
        position: absolute; bottom: 0; left: 0;
        width: 100%; overflow: hidden;
        transform-origin: 50% 68%;
        will-change: transform, filter;
        transition: transform 0.45s ease-out, filter 0.45s ease-out;
      }
      .fbg-mtn-far  { height: 52%; bottom: 30%; opacity: 0.82; filter: saturate(0.75) blur(0.3px); }
      .fbg-mtn-near { height: 36%; bottom: 28%; opacity: 0.95; }
      .fbg-trees    { height: 26%; bottom: 25%; opacity: 0.88; }

      /* The SVG inside each layer is the scroll target */
      .fbg-mtn-far  svg,
      .fbg-mtn-near svg,
      .fbg-trees    svg { display: block; height: 100%; }

      /* Ground glow */
      .fbg-ground-glow {
        position: absolute; bottom: 0; left: 0; right: 0; height: 48%;
        background:
          radial-gradient(ellipse at 50% 8%, rgba(125,125,190,0.18), transparent 38%),
          linear-gradient(to top, rgba(2,3,10,0.92), rgba(17,18,40,0.42) 58%, transparent);
        pointer-events: none;
      }

      .fbg-ground-plane {
        position: absolute; z-index: 1;
        left: -20%; right: -20%; bottom: -34%; height: 82%;
        transform-origin: 50% 0;
        transform: rotateX(61deg);
        border-top: 1px solid rgba(150,170,215,0.2);
        background:
          radial-gradient(ellipse at 12% 18%, rgba(72,76,92,0.72) 0 1.1%, transparent 1.3%),
          radial-gradient(ellipse at 82% 28%, rgba(57,63,78,0.74) 0 1.6%, transparent 1.8%),
          radial-gradient(ellipse at 30% 52%, rgba(68,72,80,0.62) 0 1.8%, transparent 2%),
          radial-gradient(ellipse at 70% 72%, rgba(48,53,63,0.8) 0 2.2%, transparent 2.4%),
          repeating-linear-gradient(90deg, transparent 0 12%, rgba(110,125,145,0.045) 12.2% 12.5%, transparent 12.7% 25%),
          repeating-linear-gradient(0deg, rgba(115,130,150,0.06) 0 1px, transparent 1px 46px),
          linear-gradient(to bottom, #252738 0%, #171925 36%, #0b0d15 100%);
        background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 46px, 100% 100%;
        box-shadow: inset 0 28px 55px rgba(150,155,205,0.08);
        will-change: transform, background-position;
        transition: transform 0.45s ease-out;
        pointer-events: none;
      }

      .fbg-path {
        position: absolute; z-index: 1;
        left: 34%; right: 34%; top: 57%; bottom: -8%;
        clip-path: polygon(46% 0, 54% 0, 100% 100%, 0 100%);
        background:
          linear-gradient(90deg, transparent, rgba(80,77,83,0.34) 14%, rgba(72,69,72,0.48) 50%, rgba(80,77,83,0.34) 86%, transparent),
          repeating-linear-gradient(to bottom, transparent 0 35px, rgba(180,175,165,0.08) 36px 38px);
        opacity: 0.8;
        filter: blur(0.2px);
        transform-origin: 50% 0;
        will-change: transform, background-position;
        transition: transform 0.45s ease-out;
        pointer-events: none;
      }

      .fbg-ground-detail {
        position: absolute; z-index: 1; inset: 66% 0 0;
        background:
          radial-gradient(ellipse at 7% 74%, #171923 0 2.2%, transparent 2.4%),
          radial-gradient(ellipse at 19% 44%, #222431 0 1.2%, transparent 1.4%),
          radial-gradient(ellipse at 88% 68%, #171923 0 2.6%, transparent 2.8%),
          radial-gradient(ellipse at 76% 36%, #222431 0 1.4%, transparent 1.6%),
          linear-gradient(78deg, transparent 0 8%, rgba(18,28,25,0.9) 8.2% 8.5%, transparent 8.7% 100%),
          linear-gradient(102deg, transparent 0 91%, rgba(18,28,25,0.9) 91.2% 91.5%, transparent 91.7%);
        opacity: 0.9;
        transform-origin: 50% 0;
        will-change: transform;
        transition: transform 0.45s ease-out;
        pointer-events: none;
      }

      .fbg-contact-shadow {
        position: absolute; z-index: 1;
        left: 50%; bottom: 22%;
        width: 26%; height: 6%;
        transform: translateX(-50%);
        border-radius: 50%;
        background: radial-gradient(ellipse, rgba(0,0,0,0.72), rgba(2,3,12,0.38) 48%, transparent 74%);
        filter: blur(8px);
        opacity: 0.78;
        will-change: transform, opacity;
        transition: transform 0.35s ease-out, opacity 0.35s ease-out;
        pointer-events: none;
      }

      .fbg-vignette {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 50% 46%, transparent 42%, rgba(2,3,15,0.18) 72%, rgba(0,1,8,0.58) 100%),
          linear-gradient(to top, rgba(2,2,12,0.42), transparent 25%);
        pointer-events: none;
      }

      /* Fog */
      .fbg-fog {
        position: absolute; bottom: 0; left: 0; right: 0; height: 20%;
        background: linear-gradient(to top,
          rgba(40,15,80,0.55) 0%,
          rgba(20,8,45,0.30) 40%,
          transparent 100%);
        pointer-events: none;
      }

      /* ── Action-aware perspective motion ────────────────── */
      @keyframes world-recede-far {
        from { transform: scale(1.04) translateY(1%); filter: saturate(0.8) blur(0); }
        to { transform: scale(0.93) translateY(-3%); filter: saturate(0.68) blur(0.6px); }
      }
      @keyframes world-recede-mid {
        from { transform: scale(1.07) translateY(2%); }
        to { transform: scale(0.88) translateY(-5%); }
      }
      @keyframes world-recede-near {
        from { transform: scale(1.13) translateY(4%); filter: blur(0); }
        to { transform: scale(0.78) translateY(-9%); filter: blur(1px); }
      }
      @keyframes ground-recede {
        from { transform: rotateX(61deg) scale(1.05); background-position: 0 0; }
        to { transform: rotateX(61deg) scale(0.82); background-position: 0 -420px; }
      }
      @keyframes path-recede {
        from { transform: scaleX(1.08) scaleY(1.08); background-position: 0 0; }
        to { transform: scaleX(0.72) scaleY(0.82); background-position: 0 -360px; }
      }
      @keyframes foreground-recede {
        from { transform: scale(1.08) translateY(3%); }
        to { transform: scale(0.78) translateY(-8%); }
      }
      @keyframes shadow-recede {
        from { transform: translateX(-50%) scale(1.08); opacity: 0.82; }
        to { transform: translateX(-50%) scale(0.72); opacity: 0.48; }
      }
      @keyframes pushup-ground {
        0%, 100% { transform: rotateX(61deg) translateY(0); }
        24%, 72% { transform: rotateX(61deg) translateY(-3.5%); }
        48% { transform: rotateX(61deg) translateY(1.5%); }
      }
      @keyframes pushup-surface {
        0%, 100% { transform: translateY(0); }
        24%, 72% { transform: translateY(-3.5%); }
        48% { transform: translateY(1.5%); }
      }
      @keyframes pushup-shadow {
        0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.78; }
        24%, 72% { transform: translateX(-50%) translateY(-30%) scale(0.88); opacity: 0.58; }
        48% { transform: translateX(-50%) translateY(10%) scale(1.08); opacity: 0.86; }
      }
      @keyframes fantasy-cloud-drift {
        from { transform: translateX(0); }
        to { transform: translateX(18%); }
      }
      @keyframes fantasy-haze-breathe {
        from { opacity: 0.45; transform: translateY(1%); }
        to { opacity: 0.85; transform: translateY(-2%); }
      }
      @keyframes fantasy-fireflies {
        0% { opacity: 0.28; transform: translate(0, 3px); }
        45% { opacity: 0.8; }
        100% { opacity: 0.42; transform: translate(5px, -5px); }
      }

      .fantasy-bg.motion-forward .fbg-mtn-far { animation: world-recede-far var(--motion-duration) ease-in both; }
      .fantasy-bg.motion-forward .fbg-mtn-near { animation: world-recede-mid var(--motion-duration) ease-in both; }
      .fantasy-bg.motion-forward .fbg-trees { animation: world-recede-near var(--motion-duration) ease-in both; }
      .fantasy-bg.motion-forward .fbg-ground-plane { animation: ground-recede var(--motion-duration) cubic-bezier(.35,.05,.8,.72) both; }
      .fantasy-bg.motion-forward .fbg-path { animation: path-recede var(--motion-duration) cubic-bezier(.35,.05,.8,.72) both; }
      .fantasy-bg.motion-forward .fbg-ground-detail { animation: foreground-recede var(--motion-duration) ease-in both; }
      .fantasy-bg.motion-forward .fbg-contact-shadow { animation: shadow-recede var(--motion-duration) ease-in both; }

      .fantasy-bg.motion-pushups .fbg-ground-plane { animation: pushup-ground var(--motion-duration) ease-in-out both; }
      .fantasy-bg.motion-pushups .fbg-path,
      .fantasy-bg.motion-pushups .fbg-ground-detail,
      .fantasy-bg.motion-pushups .fbg-trees { animation: pushup-surface var(--motion-duration) ease-in-out both; }
      .fantasy-bg.motion-pushups .fbg-contact-shadow { animation: pushup-shadow var(--motion-duration) ease-in-out both; }

      /* ── Action rail ───────────────────────────────────── */
      .action-buttons {
        display: flex; flex-direction: column;
        gap: 10px; justify-content: center; align-items: stretch;
        padding: 12px;
        border-radius: 20px;
        background: linear-gradient(160deg, rgba(7,14,40,0.80), rgba(22,32,76,0.58));
        border: 1px solid rgba(120,200,255,0.24);
        box-shadow: 0 18px 44px rgba(4,8,30,0.55);
        backdrop-filter: blur(12px);
      }

      /* ── Buttons ───────────────────────────────────────── */
      button {
        font-family: inherit;
        padding: 11px 14px;
        font-size: 13px; font-weight: 700;
        border: none; border-radius: 13px;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        text-shadow: 0 2px 8px rgba(0,0,0,0.35);
        position: relative; overflow: hidden;
      }
      /* shimmer sweep on hover */
      button::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.14) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform 0.36s ease;
      }
      button:hover::after { transform: translateX(100%); }
      button:hover:not(.btn-disabled) { transform: translateY(-3px) scale(1.04); filter: brightness(1.1); }
      button:active:not(.btn-disabled) { transform: translateY(0) scale(0.98); }

      .btn-primary {
        background: linear-gradient(135deg, #5c6fe8, #7c4dbd);
        color: white; box-shadow: 0 4px 16px rgba(100,120,230,0.45);
      }
      .btn-primary:hover:not(.btn-disabled) { box-shadow: 0 7px 24px rgba(100,120,230,0.65); }
      .btn-success {
        background: linear-gradient(135deg, #0e9e84, #28d68a);
        color: white; box-shadow: 0 4px 16px rgba(40,214,130,0.4);
      }
      .btn-success:hover:not(.btn-disabled) { box-shadow: 0 7px 24px rgba(40,214,130,0.6); }
      .btn-warning {
        background: linear-gradient(135deg, #e870e0, #e84060);
        color: white; box-shadow: 0 4px 16px rgba(232,80,100,0.4);
      }
      .btn-warning:hover:not(.btn-disabled) { box-shadow: 0 7px 24px rgba(232,80,100,0.6); }
      .btn-info {
        background: linear-gradient(135deg, #3a9afc, #00dcf0);
        color: white; box-shadow: 0 4px 16px rgba(50,170,250,0.4);
      }
      .btn-info:hover:not(.btn-disabled) { box-shadow: 0 7px 24px rgba(50,170,250,0.6); }
      .btn-disabled { opacity: 0.48; cursor: not-allowed; }
      .btn-disabled:hover { transform: none !important; filter: none !important; }
      button:disabled { opacity: 0.48; cursor: not-allowed; transform: none !important; filter: none !important; }

      /* Cooldown ring */
      .action-btn-wrap {
        position: relative; display: flex; align-items: stretch;
      }
      .action-btn-wrap > button { flex: 1; z-index: 1; }
      .cooldown-ring {
        position: absolute; inset: -3px; border-radius: 15px;
        pointer-events: none; z-index: 0;
        border: 2px solid transparent;
        transition: border-color 0.2s;
      }
      .cooldown-ring.active {
        border-color: rgba(100,200,255,0.55);
        box-shadow: 0 0 10px rgba(80,180,255,0.35);
      }
      @keyframes ring-fill {
        from { clip-path: inset(0 100% 0 0); }
        to   { clip-path: inset(0 0% 0 0); }
      }
      .action-btn-wrap.on-cooldown > button { opacity: 0.5; pointer-events: none; }
      .action-btn-wrap.on-cooldown .cooldown-ring {
        background: linear-gradient(90deg, rgba(80,160,255,0.2) var(--cd-pct, 0%), transparent var(--cd-pct, 0%));
        border-color: rgba(100,200,255,0.40);
      }

      /* ── Menu bar ──────────────────────────────────────── */
      .menu-bar {
        position: fixed; right: 20px; top: 20px;
        width: 188px;
        background: linear-gradient(160deg, rgba(5,10,32,0.92), rgba(18,26,60,0.86));
        display: flex; justify-content: center; gap: 8px;
        flex-wrap: wrap;
        padding: 12px;
        border-radius: 16px;
        border: 1px solid rgba(120,210,255,0.22);
        box-shadow: 0 12px 32px rgba(2,6,24,0.6);
        backdrop-filter: blur(12px);
        z-index: 80;
      }
      .menu-btn { flex: 1; width: 100%; max-width: none; }
      .animation-test-panel {
        width: 100%;
        border: 1px solid rgba(160,210,255,0.2);
        border-radius: 12px;
        padding: 8px;
        color: #eaf5ff;
      }
      .animation-test-panel summary {
        cursor: pointer;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.04em;
      }
      .animation-test-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 8px;
      }
      .animation-test-grid button {
        padding: 8px 6px;
        font-size: 11px;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
      }

      .modal-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        max-height: 90vh;
        overflow-y: auto;
        color: white;
      }

      .modal-title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 20px;
        text-align: center;
      }

      .pet-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }

      .pet-option {
        padding: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
        text-align: center;
      }

      .pet-option:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.5);
        transform: scale(1.05);
      }

      .pet-option-icon {
        font-size: 48px;
        margin-bottom: 10px;
      }

      .pet-option-name {
        font-weight: bold;
        font-size: 14px;
      }

      .shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }

      .shop-item {
        padding: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.3);
      }

      .shop-item:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-5px);
      }

      .shop-item-icon {
        font-size: 40px;
        margin-bottom: 8px;
      }

      .shop-item-name {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .shop-item-cost {
        background: rgba(255,215,0,0.3);
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .shop-item-desc {
        font-size: 11px;
        opacity: 0.8;
        margin-bottom: 10px;
      }

      .input-group {
        margin: 15px 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .input-group label {
        font-weight: bold;
        font-size: 14px;
      }

      .input-group input {
        padding: 10px 15px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 14px;
      }

      .input-group input::placeholder {
        color: rgba(255,255,255,0.5);
      }

      .input-group input:focus {
        outline: none;
        border-color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.15);
      }

      .close-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .close-btn:hover {
        background: rgba(255,255,255,0.3);
      }

      .particle {
        position: fixed;
        pointer-events: none;
      }

      .coin-particle {
        color: #FFD700;
        font-size: 24px;
        font-weight: bold;
        animation: float-up 1s ease-out forwards;
      }

      @keyframes float-up {
        to {
          transform: translateY(-100px);
          opacity: 0;
        }
      }

      .heart-particle {
        color: #FF69B4;
        font-size: 24px;
        animation: float-up 1s ease-out forwards;
      }

      .level-up-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #333;
        padding: 30px 50px;
        border-radius: 15px;
        font-size: 32px;
        font-weight: bold;
        z-index: 2000;
        animation: pulse-scale 0.6s ease-out;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      @keyframes pulse-scale {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      .perks-list {
        margin: 20px 0;
      }

      .perk-item {
        background: rgba(255,255,255,0.1);
        padding: 12px;
        margin: 10px 0;
        border-radius: 8px;
        border-left: 4px solid #FFD700;
      }

      .perk-name {
        font-weight: bold;
        color: #FFD700;
        margin-bottom: 5px;
      }

      .perk-desc {
        font-size: 12px;
        opacity: 0.9;
      }

      .locked-perk {
        opacity: 0.5;
        border-left-color: #666;
      }

      .locked-perk .perk-name {
        color: #999;
      }

      .teacher-panel {
        background: rgba(0,0,0,0.3);
        padding: 20px;
        border-radius: 12px;
        margin-top: 20px;
      }

      .teacher-section {
        margin-bottom: 20px;
      }

      .teacher-label {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 10px;
      }

      .pet-list {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        margin-top: 10px;
      }

      .pet-list-item {
        padding: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .pet-list-item:last-child {
        border-bottom: none;
      }

      .hidden {
        display: none !important;
      }

      /* ── Stage-first game layout ────────────────────────── */
      .main-view {
        padding: 12px;
        display: block;
      }

      .battle-stage {
        width: 100%;
        height: calc(100vh - 24px);
        margin: 0;
        display: block;
      }

      .pet-display,
      .pet-avatar {
        width: 100%;
        height: 100%;
      }

      .pet-avatar {
        min-height: 0;
        border-radius: 28px;
        border-color: rgba(140,210,255,0.3);
        box-shadow:
          0 28px 80px rgba(1,4,20,0.72),
          inset 0 0 0 1px rgba(220,240,255,0.07);
      }

      .hud-top {
        position: absolute;
        z-index: 12;
        top: 28px;
        left: 28px;
        width: min(560px, calc(100vw - 210px));
        margin: 0;
        padding: 12px 14px;
        background: linear-gradient(145deg, rgba(5,10,28,0.82), rgba(16,28,62,0.68));
        border-radius: 18px;
        animation: none;
      }

      .hud-title-row {
        margin-bottom: 7px;
      }

      .pet-name-display {
        font-size: clamp(25px, 3vw, 38px);
      }

      .xp-bar-wrap {
        margin-bottom: 8px;
      }

      .pet-stats {
        gap: 7px;
      }

      .stat-bar {
        padding: 7px 9px;
        background: rgba(8,17,42,0.68);
      }

      .stat-label {
        margin-bottom: 4px;
      }

      .action-buttons {
        position: absolute;
        z-index: 14;
        left: 50%;
        bottom: 28px;
        width: min(760px, calc(100vw - 64px));
        transform: translateX(-50%);
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 10px;
        padding: 10px;
        border-radius: 24px;
        background: rgba(5,10,28,0.76);
        border-color: rgba(155,215,255,0.3);
      }

      .action-btn-wrap {
        min-width: 0;
      }

      .action-buttons button {
        width: 100%;
        min-height: 68px;
        padding: 8px 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        border: 1px solid rgba(255,255,255,0.13);
      }

      .action-icon {
        font-size: 25px;
        line-height: 1;
      }

      .action-label {
        font-size: 13px;
        font-weight: 800;
      }

      .action-hint {
        font-size: 9px;
        font-weight: 600;
        opacity: 0.72;
        text-shadow: none;
      }

      .teacher-quick-btn {
        position: absolute;
        z-index: 15;
        top: 28px;
        right: 28px;
        min-height: 44px;
        padding: 9px 14px;
        color: #d8e8ff;
        background: rgba(5,10,28,0.74);
        border: 1px solid rgba(155,215,255,0.28);
        backdrop-filter: blur(12px);
      }

      .stage-prompt {
        position: absolute;
        z-index: 5;
        left: 50%;
        bottom: 116px;
        transform: translateX(-50%);
        padding: 7px 13px;
        color: rgba(225,240,255,0.82);
        background: rgba(2,5,18,0.46);
        border: 1px solid rgba(160,215,255,0.14);
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        pointer-events: none;
        backdrop-filter: blur(8px);
      }

      .menu-bar {
        right: 28px;
        top: 82px;
      }

      button:focus-visible,
      .pet-avatar:focus-visible {
        outline: 3px solid #8ee7ff;
        outline-offset: 3px;
      }

      .teacher-panel {
        background: rgba(2,7,24,0.34);
      }

      .teacher-modal-content {
        max-width: 680px;
      }

      .teacher-presets {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0 14px;
      }

      .teacher-presets button {
        padding: 9px 6px;
      }

      .teacher-bulk-btn {
        width: 100%;
        margin-bottom: 12px;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }

      @media (max-height: 700px) and (min-width: 769px) {
        .hud-top {
          width: min(680px, calc(100vw - 210px));
          padding: 8px 12px;
        }

        .hud-title-row {
          margin-bottom: 4px;
        }

        .pet-name-display {
          font-size: 26px;
        }

        .xp-bar-wrap {
          margin-bottom: 5px;
        }

        .stat-bar {
          padding: 5px 8px;
        }

        .action-buttons {
          bottom: 18px;
        }

        .action-buttons button {
          min-height: 58px;
        }
      }

      @media (max-width: 768px) {
        .main-view {
          padding: 6px;
        }

        .hud-top {
          top: 14px;
          left: 14px;
          width: calc(100vw - 78px);
          padding: 9px;
        }

        .pet-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .battle-stage {
          width: 100%;
          height: calc(100vh - 12px);
        }

        .pet-avatar {
          height: 100%;
          border-radius: 20px;
        }

        .action-buttons {
          bottom: 14px;
          width: calc(100vw - 28px);
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 5px;
          padding: 6px;
        }

        .action-buttons button {
          min-width: 0;
          min-height: 58px;
          padding: 6px 2px;
        }

        .action-icon {
          font-size: 21px;
        }

        .action-label {
          font-size: 10px;
        }

        .action-hint,
        .stage-prompt {
          display: none;
        }

        .modal-content {
          width: 95%;
          padding: 20px;
        }

        .pet-name-display {
          font-size: 26px;
        }

        button {
          padding: 10px 14px;
          font-size: 12px;
        }

        .menu-bar {
          right: 10px;
          top: 62px;
          width: 170px;
        }

        .teacher-quick-btn {
          top: 14px;
          right: 14px;
          width: 48px;
          padding: 8px;
          overflow: hidden;
          color: transparent;
        }

        .teacher-quick-btn::before {
          content: '⚙️';
          color: white;
          font-size: 20px;
        }

        .teacher-presets {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  showSelectionScreen() {
    const pets = this.store.getState().pets;
    
    if (pets.length === 0) {
      this.showCreatePetModal();
    } else {
      this.showPetSelectionModal(pets);
    }
  }

  private showCreatePetModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.position = 'relative';

    content.innerHTML = `
      <button class="close-btn">×</button>
      <div class="modal-title">Create Your Class Pet! 🎉</div>
      <div style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
        Choose a pet type and give it a name. Your pet will level up as the class does well!
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="font-weight: bold; font-size: 14px;">Pet Type:</label>
        <div class="pet-selector">
          ${PET_TYPES.map(type => `
            <div class="pet-option" data-type="${type}">
              <div class="pet-option-icon">${this.getPetEmoji(type)}</div>
              <div class="pet-option-name">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
              <div style="font-size: 10px; margin-top: 8px; opacity: 0.8;">${getPetDescription(type)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="input-group">
        <label>Pet Name:</label>
        <input type="text" id="petNameInput" placeholder="Enter a name (max 20 chars)" maxlength="20">
      </div>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button class="btn-primary" style="flex: 1;" id="createBtn">Create Pet</button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    let selectedType: PetType = 'dog';

    const petOptions = content.querySelectorAll('.pet-option');
    petOptions.forEach(option => {
      option.addEventListener('click', () => {
        petOptions.forEach(p => {
          (p as HTMLElement).style.borderColor = 'transparent';
        });
        (option as HTMLElement).style.borderColor = 'rgba(255,255,255,0.8)';
        selectedType = option.getAttribute('data-type') as PetType;
      });
    });
    (petOptions[0] as HTMLElement).click();

    const createBtn = content.querySelector('#createBtn') as HTMLButtonElement;
    const nameInput = content.querySelector('#petNameInput') as HTMLInputElement;
    const closeBtn = content.querySelector('.close-btn') as HTMLButtonElement;

    createBtn.addEventListener('click', () => {
      const name = nameInput.value.trim() || selectedType.charAt(0).toUpperCase() + selectedType.slice(1);
      const pet = createNewPet(name, selectedType);
      this.store.getState().addPet(pet);
      this.store.getState().setCurrentPet(pet.id);
      modal.remove();
      this.showGameScreen();
    });

    closeBtn.addEventListener('click', () => {
      modal.remove();
      location.reload();
    });
  }

  private showPetSelectionModal(pets: Pet[]) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.position = 'relative';

    content.innerHTML = `
      <div class="modal-title">Select Your Pet 🐾</div>
      <div class="pet-selector">
        ${pets.map(pet => `
          <div class="pet-option" data-pet-id="${pet.id}">
            <div class="pet-option-icon">${this.getPetEmoji(pet.type)}</div>
            <div class="pet-option-name">${pet.name}</div>
            <div style="font-size: 10px; margin-top: 8px;">Lvl ${pet.level}</div>
          </div>
        `).join('')}
        <div class="pet-option" id="createNewPetBtn" style="border: 2px dashed rgba(255,255,255,0.5);">
          <div class="pet-option-icon">➕</div>
          <div class="pet-option-name">New Pet</div>
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const petOptions = content.querySelectorAll('.pet-option');
    petOptions.forEach(option => {
      option.addEventListener('click', () => {
        const petId = option.getAttribute('data-pet-id');
        if (petId) {
          this.store.getState().setCurrentPet(petId);
          modal.remove();
          this.showGameScreen();
        }
      });
    });

    const createNewBtn = content.querySelector('#createNewPetBtn') as HTMLElement;
    createNewBtn.addEventListener('click', () => {
      modal.remove();
      this.showCreatePetModal();
    });
  }

  showGameScreen() {
    const state = this.store.getState();
    const pet = state.currentPet;
    if (!pet) return;

    const xpForNext = (pet.level + 1) * 100;
    const xpPct = Math.min(100, Math.round(pet.experience / xpForNext * 100));

    this.container.innerHTML = `
      <div class="main-view">
        <!-- animated background orbs -->
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>

        <div class="hud-top" aria-label="${pet.name}'s status">
          <div class="hud-title-row">
            <div class="pet-name-display">${pet.name}</div>
            <div class="level-badge">⭐ Level ${pet.level}</div>
          </div>
          <div class="xp-row">
            <div class="xp-label" id="xpLabel">Next level · ${pet.experience}/${xpForNext} XP</div>
            <div class="xp-bar-wrap">
              <div class="xp-bar-fill" id="xpFill" style="width: ${xpPct}%"></div>
            </div>
          </div>
          <div class="pet-stats">
            <div class="stat-bar" title="Happiness ${pet.happiness} out of 100">
              <div class="stat-label" id="happyLabel">❤️ Happy ${pet.happiness}</div>
              <div class="progress-bar"><div class="progress-fill" id="happyFill" style="width: ${pet.happiness}%"></div></div>
            </div>
            <div class="stat-bar" title="Fullness ${100 - pet.hunger} out of 100">
              <div class="stat-label" id="fullLabel">🍽️ Full ${100 - pet.hunger}</div>
              <div class="progress-bar"><div class="progress-fill" id="fullFill" style="width: ${100 - pet.hunger}%; background: linear-gradient(90deg, #FF6B6B, #FF8E72);"></div></div>
            </div>
            <div class="stat-bar" title="Energy ${pet.energy} out of 100">
              <div class="stat-label" id="energyLabel">⚡ Energy ${pet.energy}</div>
              <div class="progress-bar"><div class="progress-fill" id="energyFill" style="width: ${pet.energy}%; background: linear-gradient(90deg, #4ECDC4, #44A08D);"></div></div>
            </div>
            <div class="stat-bar">
              <div class="stat-label">💰 Coins</div>
              <div class="coins-value" id="coinsValue">${pet.coins}</div>
            </div>
          </div>
        </div>

        <div class="battle-stage">
          <div class="pet-display">
            <div
              class="pet-avatar"
              id="petAvatar"
              role="button"
              tabindex="0"
              aria-label="Say hello to ${pet.name}"
            ></div>
            <div class="stage-prompt">Tap ${pet.name} to say hello</div>
          </div>

          <div class="action-buttons" aria-label="Pet actions">
            <div class="action-btn-wrap" id="feedWrap">
              <div class="cooldown-ring"></div>
              <button class="btn-success" id="feedBtn" aria-label="Feed ${pet.name}">
                <span class="action-icon">🍖</span>
                <span class="action-label">Feed</span>
                <span class="action-hint">+10 happy</span>
              </button>
            </div>
            <div class="action-btn-wrap" id="playWrap">
              <div class="cooldown-ring"></div>
              <button class="btn-warning" id="playBtn" ${pet.energy <= 10 ? 'disabled' : ''} aria-label="Play with ${pet.name}">
                <span class="action-icon">🎮</span>
                <span class="action-label">Play</span>
                <span class="action-hint">+15 XP</span>
              </button>
            </div>
            <div class="action-btn-wrap" id="restWrap">
              <div class="cooldown-ring"></div>
              <button class="btn-info" id="restBtn" aria-label="Let ${pet.name} rest">
                <span class="action-icon">😴</span>
                <span class="action-label">Rest</span>
                <span class="action-hint">+40 energy</span>
              </button>
            </div>
            <div class="action-btn-wrap" id="danceWrap">
              <div class="cooldown-ring"></div>
              <button class="btn-primary" id="danceBtn" aria-label="Make ${pet.name} dance">
                <span class="action-icon">💃</span>
                <span class="action-label">Dance</span>
                <span class="action-hint">Brain break</span>
              </button>
            </div>
            <div class="action-btn-wrap" id="sneezeWrap">
              <div class="cooldown-ring"></div>
              <button class="btn-warning" id="sneezeBtn" aria-label="Test ${pet.name}'s sneeze">
                <span class="action-icon">🤧</span>
                <span class="action-label">Sneeze</span>
                <span class="action-hint">Test effect</span>
              </button>
            </div>
            ${pet.type === 'dragon' ? `
              <div class="action-btn-wrap" id="jumpingJacksWrap">
                <div class="cooldown-ring"></div>
                <button class="btn-primary" id="jumpingJacksBtn" aria-label="Make ${pet.name} do jumping jacks">
                  <span class="action-icon">🙌</span>
                  <span class="action-label">Jumping Jacks</span>
                  <span class="action-hint">Rig test</span>
                </button>
              </div>
            ` : ''}
            <button class="btn-primary" id="menuBtn" aria-expanded="false" aria-controls="menuBar">
              <span class="action-icon">🎒</span>
              <span class="action-label">More</span>
              <span class="action-hint">Shop & pets</span>
            </button>
          </div>
        </div>

        <button class="teacher-quick-btn" id="teacherBtn" aria-label="Open teacher controls">
          ⚙️ Teacher
        </button>
      </div>

      <div class="menu-bar" id="menuBar" style="display: none; flex-direction: column;">
        <button class="btn-info menu-btn" id="shopBtn">🛍️ Shop</button>
        <button class="btn-primary menu-btn" id="perksBtn">⭐ Perks</button>
        <button class="btn-primary menu-btn" id="statsBtn">📊 Stats</button>
        <button class="btn-primary menu-btn" id="selectBtn">🐾 Select Pet</button>
        ${pet.type === 'dragon' ? `
          <details class="animation-test-panel">
            <summary>Animation Tests</summary>
            <div class="animation-test-grid">
              <button class="btn-info" data-pet-animation="idle_inspect_paw">Inspect Paw</button>
              <button class="btn-info" data-pet-animation="idle_chase_tail">Chase Tail</button>
              <button class="btn-info" data-pet-animation="idle_sit_down">Sit</button>
              <button class="btn-info" data-pet-animation="idle_head_look">Look Around</button>
              <button class="btn-info" data-pet-animation="idle_eye_squint">Squint</button>
              <button class="btn-warning" data-pet-animation="idle_failed_fire">Failed Fire</button>
              <button class="btn-warning" data-pet-animation="idle_failed_fire_sneeze">Fire + Sneeze</button>
              <button class="btn-warning" data-pet-animation="idle_sneeze_fall">Sneeze Fall</button>
              <button class="btn-success" data-pet-animation="idle_recover_from_fall">Recover</button>
            </div>
          </details>
        ` : ''}
      </div>
    `;

    this.attachGameEventListeners();
  }

  private startCooldown(wrapId: string, durationMs: number) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.classList.add('on-cooldown');
    const ring = wrap.querySelector('.cooldown-ring') as HTMLElement | null;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / durationMs) * 100);
      if (ring) ring.style.setProperty('--cd-pct', `${pct}%`);
      if (pct < 100) requestAnimationFrame(tick);
      else wrap.classList.remove('on-cooldown');
    };
    requestAnimationFrame(tick);
  }

  private refreshHudStats(): void {
    const pet = this.store.getState().currentPet;
    if (!pet) return;

    const xpForNext = (pet.level + 1) * 100;
    const xpPct = Math.min(100, Math.round(pet.experience / xpForNext * 100));
    const fullness = 100 - pet.hunger;
    const updates: Array<[string, string]> = [
      ['xpLabel', `Next level · ${pet.experience}/${xpForNext} XP`],
      ['happyLabel', `❤️ Happy ${pet.happiness}`],
      ['fullLabel', `🍽️ Full ${fullness}`],
      ['energyLabel', `⚡ Energy ${pet.energy}`],
      ['coinsValue', `${pet.coins}`],
    ];
    updates.forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    });

    const widths: Array<[string, number]> = [
      ['xpFill', xpPct],
      ['happyFill', pet.happiness],
      ['fullFill', fullness],
      ['energyFill', pet.energy],
    ];
    widths.forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.style.width = `${value}%`;
    });
  }

  private spawnCombo(el: HTMLElement | null, text: string) {
    if (!el) return;
    const popup = document.createElement('div');
    popup.textContent = text;
    popup.style.cssText = `
      position: absolute; left: 50%; top: 12px;
      transform: translate(-50%, 0);
      font-family: 'Rajdhani','Arial',sans-serif;
      font-size: 18px; font-weight: 800;
      color: #fff;
      text-shadow: 0 0 12px rgba(100,220,255,0.9), 0 2px 6px rgba(0,0,0,0.5);
      pointer-events: none; z-index: 999;
      white-space: nowrap;
      animation: combo-pop 1.1s ease forwards;
    `;
    el.style.position = 'relative';
    el.appendChild(popup);
    setTimeout(() => popup.remove(), 1150);
  }

  private spawnDragonSneezeEffect(stage: HTMLElement, eventName = 'sneeze_spark_smoke'): void {
    const effect = document.createElement('div');
    effect.className = 'dragon-sneeze-fx';
    if (eventName.includes('failed_fire') || eventName.includes('tiny')) {
      effect.classList.add('tiny-fx');
    }
    effect.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('span');
    ring.className = 'dragon-sneeze-ring';
    effect.appendChild(ring);

    const smokePuffs = [
      { size: 46, dx: -55, dy: -38, delay: 0 },
      { size: 58, dx: 8, dy: -65, delay: 0.05 },
      { size: 42, dx: 62, dy: -30, delay: 0.1 },
      { size: 34, dx: -10, dy: -92, delay: 0.16 },
    ];
    smokePuffs.forEach(({ size, dx, dy, delay }) => {
      const puff = document.createElement('span');
      puff.className = 'dragon-smoke-puff';
      puff.style.setProperty('--size', `${size}px`);
      puff.style.setProperty('--dx', `${dx}px`);
      puff.style.setProperty('--dy', `${dy}px`);
      puff.style.setProperty('--delay', `${delay}s`);
      effect.appendChild(puff);
    });

    const sparks = [
      { dx: -72, dy: -42, rotation: -55, delay: 0 },
      { dx: -38, dy: -78, rotation: -28, delay: 0.03 },
      { dx: 12, dy: -92, rotation: 6, delay: 0.01 },
      { dx: 52, dy: -70, rotation: 34, delay: 0.06 },
      { dx: 82, dy: -30, rotation: 62, delay: 0.02 },
      { dx: 45, dy: 2, rotation: 102, delay: 0.08 },
    ];
    sparks.forEach(({ dx, dy, rotation, delay }) => {
      const spark = document.createElement('span');
      spark.className = 'dragon-sneeze-spark';
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);
      spark.style.setProperty('--rotation', `${rotation}deg`);
      spark.style.setProperty('--delay', `${delay}s`);
      effect.appendChild(spark);
    });

    stage.appendChild(effect);
    window.setTimeout(() => effect.remove(), 1500);
  }

  private attachGameEventListeners() {
    const store = this.store;
    const petAvatar = document.getElementById('petAvatar') as HTMLElement;
    
    // Initialize 3D renderer
    if (petAvatar) {
      const pet = store.getState().currentPet;
      if (pet) {
        // The Blender environment renders inside the Three.js canvas. These
        // layers remain only as the sky and loading fallback.
        petAvatar.innerHTML = `
          <div class="fantasy-bg" id="fantasyBg">
            <div class="fbg-stars"></div>
            <div class="fbg-nebula"></div>
            <div class="fbg-clouds"></div>
            <div class="fbg-haze"></div>
            <div class="fbg-vignette"></div>
          </div>
        `;
        petAvatar.addEventListener('dragon-sneeze', (event) => {
          const detail = (event as CustomEvent<{ event?: string }>).detail;
          this.spawnDragonSneezeEffect(petAvatar, detail?.event);
        });

        // Clean up old renderer
        if (this.pet3DRenderer) {
          this.pet3DRenderer.destroy();
        }

        // Create new 3D renderer
        this.pet3DRenderer = new Pet3DRenderer('petAvatar', { walkSpeed: 1 });
        this.pet3DRenderer.loadPet(pet.type).then(() => {
          // Pet model loaded successfully
        }).catch(err => {
          console.error('Failed to load 3D model:', err);
        });

        petAvatar.addEventListener('click', () => {
          SoundEffects.playAnimalSound(pet.type);
          this.pet3DRenderer?.playAnimation('greet');
        });
        petAvatar.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            petAvatar.click();
          }
        });
      }
    }

    const feedBtn = document.getElementById('feedBtn') as HTMLButtonElement;
    feedBtn?.addEventListener('click', () => {
      const pet = store.getState().currentPet;
      if (pet) {
        SoundEffects.playAnimalSound(pet.type);
        store.getState().feedPet(pet.id);
        this.createParticles('+10 😋', 'heart', 5);
        this.spawnCombo(document.getElementById('feedWrap'), '+10 Happiness!');
        this.startCooldown('feedWrap', 3000);
        this.pet3DRenderer?.playAnimation('feed');
        this.refreshHudStats();
      }
    });

    const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    playBtn?.addEventListener('click', () => {
      const pet = store.getState().currentPet;
      if (pet && pet.energy > 10) {
        SoundEffects.playAnimalSound(pet.type);
        store.getState().playWithPet(pet.id);
        SoundEffects.playCoinSound();
        this.createParticles('+15 XP', 'coin', 5);
        this.spawnCombo(document.getElementById('playWrap'), '+15 XP');
        this.startCooldown('playWrap', 3500);
        this.pet3DRenderer?.playAnimation('play');
        this.refreshHudStats();
      }
    });

    const restBtn = document.getElementById('restBtn') as HTMLButtonElement;
    restBtn?.addEventListener('click', () => {
      const pet = store.getState().currentPet;
      if (pet) {
        store.getState().restPet(pet.id);
        this.createParticles('💤', 'heart', 3);
        this.spawnCombo(document.getElementById('restWrap'), '💤 Resting…');
        this.startCooldown('restWrap', 4000);
        this.pet3DRenderer?.playAnimation('rest');
        this.refreshHudStats();
      }
    });

    const danceBtn = document.getElementById('danceBtn') as HTMLButtonElement;
    danceBtn?.addEventListener('click', () => {
      const pet = store.getState().currentPet;
      if (pet) {
        SoundEffects.playAnimalSound(pet.type);
        this.pet3DRenderer?.playAnimation('dance');
        this.createParticles('🎉', 'heart', 8);
        this.spawnCombo(document.getElementById('danceWrap'), '🎉 Dance!');
        this.startCooldown('danceWrap', 5000);
      }
    });

    const sneezeBtn = document.getElementById('sneezeBtn') as HTMLButtonElement;
    sneezeBtn?.addEventListener('click', () => {
      this.pet3DRenderer?.playAnimation('sneeze');
      this.spawnCombo(document.getElementById('sneezeWrap'), 'Achoo! ✨');
      this.startCooldown('sneezeWrap', 2400);
    });

    const jumpingJacksBtn = document.getElementById('jumpingJacksBtn') as HTMLButtonElement;
    jumpingJacksBtn?.addEventListener('click', () => {
      this.pet3DRenderer?.playAnimation('jumping_jacks');
      this.spawnCombo(document.getElementById('jumpingJacksWrap'), 'Jump! 🙌');
      this.startCooldown('jumpingJacksWrap', 4300);
    });

    document.querySelectorAll<HTMLButtonElement>('[data-pet-animation]').forEach((button) => {
      button.addEventListener('click', () => {
        const animation = button.dataset.petAnimation as PetAnimation | undefined;
        if (!animation) return;
        this.pet3DRenderer?.playAnimation(animation);
      });
    });

    const menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;
    const menuBar = document.getElementById('menuBar') as HTMLElement;
    menuBtn?.addEventListener('click', () => {
      if (menuBar.style.display === 'none' || menuBar.style.display === '') {
        menuBar.style.display = 'flex';
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.innerHTML = `
          <span class="action-icon">✕</span>
          <span class="action-label">Close</span>
          <span class="action-hint">Back to game</span>
        `;
      } else {
        menuBar.style.display = 'none';
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = `
          <span class="action-icon">🎒</span>
          <span class="action-label">More</span>
          <span class="action-hint">Shop & pets</span>
        `;
        this.pet3DRenderer?.playAnimation('goodbye');
      }
    });

    document.getElementById('shopBtn')?.addEventListener('click', () => this.showShopModal());
    document.getElementById('perksBtn')?.addEventListener('click', () => this.showPerksModal());
    document.getElementById('teacherBtn')?.addEventListener('click', () => this.showTeacherPanel());
    document.getElementById('statsBtn')?.addEventListener('click', () => this.showStatsModal());
    document.getElementById('selectBtn')?.addEventListener('click', () => {
      const pets = store.getState().pets;
      this.showPetSelectionModal(pets);
    });
  }

  private showShopModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const pet = this.store.getState().currentPet;
    if (!pet) return;

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.position = 'relative';

    content.innerHTML = `
      <button class="close-btn">×</button>
      <div class="modal-title">🛍️ Shop</div>
      <div style="margin-bottom: 15px; text-align: center; font-size: 18px; font-weight: bold;">
        💰 ${pet.coins} coins
      </div>
      <div class="shop-grid">
        ${SHOP_ITEMS.map(item => `
          <div class="shop-item" data-item-id="${item.id}" data-cost="${item.cost}">
            <div class="shop-item-icon">${this.getItemEmoji(item.id)}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.description}</div>
            <div class="shop-item-cost">💰 ${item.cost}</div>
            <button class="btn-success" style="width: 100%; padding: 8px;">Buy</button>
          </div>
        `).join('')}
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const shopItems = content.querySelectorAll('.shop-item');
    shopItems.forEach(item => {
      const button = item.querySelector('button') as HTMLButtonElement;
      const cost = parseInt(item.getAttribute('data-cost') || '0');
      
      if (pet.coins < cost) {
        button.disabled = true;
        button.className = 'btn-success btn-disabled';
      }

      button.addEventListener('click', () => {
        if (pet.coins >= cost) {
          const updatedPet = {
            ...pet,
            coins: pet.coins - cost,
          };
          this.store.getState().updateCurrentPet(updatedPet);
          this.createParticles('-' + cost, 'coin', 3);
          modal.remove();
          this.showGameScreen();
        }
      });
    });

    const closeBtn = content.querySelector('.close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => modal.remove());
  }

  private showPerksModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const pet = this.store.getState().currentPet;
    if (!pet) return;

    const unlockedPerks = getUnlockedPerks(pet.level);
    const allPerks = getUnlockedPerks(20);

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.position = 'relative';

    content.innerHTML = `
      <button class="close-btn">×</button>
      <div class="modal-title">⭐ Perks</div>
      <div style="margin-bottom: 15px; text-align: center; font-size: 14px;">
        Level ${pet.level} - Unlocked ${unlockedPerks.length}/${allPerks.length} Perks
      </div>
      <div class="perks-list">
        ${allPerks.map(perk => `
          <div class="perk-item ${pet.level < perk.level ? 'locked-perk' : ''}">
            <div class="perk-name">${perk.name} ${pet.level >= perk.level ? '✓' : '🔒'}</div>
            <div class="perk-desc">${perk.description}</div>
            ${pet.level < perk.level ? `<div style="font-size: 11px; margin-top: 5px;">Unlock at Level ${perk.level}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const closeBtn = content.querySelector('.close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => modal.remove());
  }

  private showTeacherPanel() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Teacher controls');

    const content = document.createElement('div');
    content.className = 'modal-content teacher-modal-content';
    content.style.position = 'relative';

    const store = this.store.getState();
    const pets = store.pets;

    content.innerHTML = `
      <button class="close-btn">×</button>
      <div class="modal-title">👨‍🏫 Teacher Panel</div>
      
      <div class="teacher-panel">
        <div class="teacher-section">
          <div class="teacher-label">Quick classroom rewards</div>
          <div class="teacher-presets" aria-label="Reward amount presets">
            <button class="btn-primary reward-preset" data-amount="1">+1</button>
            <button class="btn-primary reward-preset" data-amount="5">+5</button>
            <button class="btn-primary reward-preset" data-amount="10">+10</button>
            <button class="btn-primary reward-preset" data-amount="25">+25</button>
          </div>
          <div class="input-group">
            <label for="rewardAmount">Coins to award</label>
            <input type="number" id="rewardAmount" inputmode="numeric" value="10" min="1" max="999">
          </div>
          <button class="btn-warning teacher-bulk-btn" id="rewardAllBtn">🎉 Reward everyone</button>
          <div class="pet-list">
            ${pets.map(pet => `
              <div class="pet-list-item">
                <div>
                  <strong>${pet.name}</strong> - Lvl ${pet.level}
                  <div id="teacherCoins-${pet.id}" style="font-size: 12px; opacity: 0.8;">💰 ${pet.coins}</div>
                </div>
                <button class="btn-success reward-btn" data-pet-id="${pet.id}" style="padding: 10px 15px;">Award</button>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="teacher-section">
          <div class="teacher-label">Display tools</div>
          <button class="btn-info teacher-bulk-btn" id="fullscreenBtn">⛶ Fullscreen for projector</button>
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const amountInput = content.querySelector('#rewardAmount') as HTMLInputElement;
    const rewardBtns = content.querySelectorAll('.reward-btn');
    const presetBtns = content.querySelectorAll('.reward-preset');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountInput.value = btn.getAttribute('data-amount') ?? '10';
        amountInput.focus();
      });
    });

    rewardBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const petId = btn.getAttribute('data-pet-id');
        const amount = Math.max(1, Math.min(999, parseInt(amountInput.value) || 10));
        if (petId) {
          this.store.getState().rewardStudent(petId, amount);
          this.createParticles('+' + amount, 'coin', 5);
          const updatedPet = this.store.getState().pets.find(pet => pet.id === petId);
          const coinLabel = content.querySelector(`#teacherCoins-${petId}`);
          if (updatedPet && coinLabel) coinLabel.textContent = `💰 ${updatedPet.coins}`;
          const button = btn as HTMLButtonElement;
          const originalText = button.textContent;
          button.textContent = `+${amount} ✓`;
          window.setTimeout(() => { button.textContent = originalText; }, 900);
        }
      });
    });

    content.querySelector('#rewardAllBtn')?.addEventListener('click', () => {
      const amount = Math.max(1, Math.min(999, parseInt(amountInput.value) || 10));
      if (!window.confirm(`Award ${amount} coins to all ${pets.length} pets?`)) return;
      pets.forEach(pet => this.store.getState().rewardStudent(pet.id, amount));
      this.createParticles('+' + amount, 'coin', 8);
      pets.forEach(pet => {
        const updatedPet = this.store.getState().pets.find(candidate => candidate.id === pet.id);
        const coinLabel = content.querySelector(`#teacherCoins-${pet.id}`);
        if (updatedPet && coinLabel) coinLabel.textContent = `💰 ${updatedPet.coins}`;
      });
    });

    content.querySelector('#fullscreenBtn')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen().then(() => closeTeacherPanel());
      } else {
        void document.exitFullscreen().then(() => closeTeacherPanel());
      }
    });

    const closeBtn = content.querySelector('.close-btn') as HTMLButtonElement;
    const closeTeacherPanel = () => {
      modal.remove();
      document.removeEventListener('keydown', closeOnEscape);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTeacherPanel();
      }
    };
    closeBtn.addEventListener('click', closeTeacherPanel);
    document.addEventListener('keydown', closeOnEscape);
    window.setTimeout(() => amountInput.focus(), 0);
  }

  private showStatsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const pet = this.store.getState().currentPet;
    if (!pet) return;

    const stats = calculateStats(pet);

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.position = 'relative';

    content.innerHTML = `
      <button class="close-btn">×</button>
      <div class="modal-title">📊 Pet Stats</div>
      
      <div style="margin-top: 20px;">
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">🎯 Progress</h3>
          <div class="stat-bar" style="margin-bottom: 10px;">
            <div class="stat-label">Experience to Next Level</div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${stats.levelProgress}%"></div></div>
            <div style="text-align: center; font-size: 12px; margin-top: 5px;">${pet.experience}/${(pet.level + 1) * 100} XP</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="margin-bottom: 10px;">📈 Stats</h3>
          <table style="width: 100%; font-size: 14px; line-height: 1.8;">
            <tr><td>Happiness:</td><td style="text-align: right;">${pet.happiness}/100 ❤️</td></tr>
            <tr><td>Hunger:</td><td style="text-align: right;">${100 - pet.hunger}/100 🍽️</td></tr>
            <tr><td>Energy:</td><td style="text-align: right;">${pet.energy}/100 ⚡</td></tr>
            <tr><td>Total Coins:</td><td style="text-align: right;">${pet.coins} 💰</td></tr>
            <tr><td>Level:</td><td style="text-align: right;">${pet.level} 🏆</td></tr>
            <tr><td>Age:</td><td style="text-align: right;">${this.getDaysOld(pet.createdAt)}</td></tr>
          </table>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
          <h3 style="margin-bottom: 10px;">📦 Inventory</h3>
          ${pet.inventory.length > 0 
            ? `<div>${pet.inventory.map(item => `<div style="margin-bottom: 8px;">• ${item.name} x${item.quantity}</div>`).join('')}</div>`
            : '<div style="opacity: 0.7;">No items yet. Visit the shop!</div>'
          }
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const closeBtn = content.querySelector('.close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => modal.remove());
  }

  private createParticles(text: string, type: 'coin' | 'heart', count: number) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = `particle ${type}-particle`;
        particle.textContent = type === 'coin' ? '💰' : '❤️';
        if (text.includes('XP')) particle.textContent = '✨';
        if (text.includes('😋')) particle.textContent = '😋';
        if (text.includes('💤')) particle.textContent = '💤';
        if (text.includes('🎉')) particle.textContent = '🎉';

        const x = Math.random() * window.innerWidth;
        const y = window.innerHeight - 100;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
      }, i * 100);
    }
  }

  private getPetEmoji(type: PetType): string {
    const emojis: Record<PetType, string> = {
      dog: '🐕',
      cat: '🐱',
      unicorn: '🦄',
      dragon: '🐉',
      phoenix: '🔥',
      trex: '🦖',
      triceratops: '🦕',
      stegosaurus: '🦕',
      pterodactyl: '🦕',
    };
    return emojis[type];
  }

  private getItemEmoji(itemId: string): string {
    const emojis: Record<string, string> = {
      apple: '🍎',
      pizza: '🍕',
      ice_cream: '🍦',
      burger: '🍔',
      ball: '🎾',
      frisbee: '🥏',
      stick: '🦴',
      rope: '🧵',
      house: '🏠',
      bed: '🛏️',
      tree: '🌳',
      bowl: '🥣',
      bow: '🎀',
      crown: '👑',
      sunglasses: '😎',
      collar: '📿',
    };
    return emojis[itemId] || '📦';
  }

  private getDaysOld(createdAt: number): string {
    const days = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    return `${days}d old`;
  }
}
