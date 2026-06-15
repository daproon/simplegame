import { Pet3DRenderer, type PetAnimation, type SceneAssetTransform } from './pet3DRenderer';
import { SoundEffects } from './soundEffects';
import { classroomAdventureStore } from './adventureStore';
import { getGoalDefinition, HABITAT_SHOP_ITEMS } from './adventureContent';
import type { RewardMode } from './adventureTypes';
import { createNewPet } from './gameData';
import { useGameStore } from './store';
import { publicAsset } from './publicAsset';

interface AdventureAssetDefinition extends SceneAssetTransform {
  asset_id: string;
  name: string;
  model_file: string;
  object_names?: string[];
  available_states?: string[];
  stage_visibility?: Record<string, { show?: string[]; hide?: string[] }>;
  event_timing?: Record<string, {
    duration_frames?: number;
    duration_seconds?: number;
    events: Array<{
      event: string;
      frame: number;
      normalizedTime: number;
      state?: string;
    }>;
  }>;
  idle_action?: string;
  status?: 'accepted' | 'review' | 'fail';
}

interface AdventureAssetManifest {
  version: string;
  assets: Record<string, AdventureAssetDefinition>;
}

export class ClassroomAdventureUI {
  private container: HTMLElement;
  private renderer: Pet3DRenderer | null = null;
  private state = classroomAdventureStore.getState();
  private lastReaction = '';
  private eventTimers: number[] = [];
  private assetManifest: AdventureAssetManifest | null = null;
  private using3DAdventureAssets = false;
  private loadedSceneAssets = new Set<string>();
  private berryTimers: number[] = [];
  private berryFeedActive = false;
  private soccerActive = false;
  private petPromptActive = false;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) ?? document.body;
    this.ensureDragon();
    this.installStyles();
    this.render();
    classroomAdventureStore.subscribe((state) => {
      this.state = state;
      this.updateHud();
      this.updateWorld();
    });
    document.addEventListener('keydown', this.handleShortcut);
  }

  private ensureDragon(): void {
    const legacy = useGameStore.getState();
    if (legacy.currentPet?.type === 'dragon') return;
    const existingDragon = legacy.pets.find((pet) => pet.type === 'dragon');
    if (existingDragon) {
      legacy.setCurrentPet(existingDragon.id);
      return;
    }
    const dragon = createNewPet(this.state?.dragonName || 'Lumi', 'dragon', 'classroom-dragon');
    legacy.addPet(dragon);
    legacy.setCurrentPet(dragon.id);
  }

  private installStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      *{box-sizing:border-box} body{margin:0;overflow:hidden;background:#07132e;color:#fff;font-family:Nunito,Arial,sans-serif}
      button,input,select{font:inherit} button{cursor:pointer}
      .adventure-shell{height:100vh;min-height:560px;position:relative;overflow:hidden;background:radial-gradient(circle at 75% 18%,rgba(113,155,255,.2),transparent 25%),linear-gradient(#102d61,#271e5a 56%,#111a3c)}
      .habitat{position:absolute;inset:0}.pet-avatar{position:absolute;inset:0;overflow:hidden}.pet-avatar canvas{position:absolute!important;inset:0;width:100%!important;height:100%!important}
      .story-hud{position:absolute;z-index:20;top:18px;left:50%;transform:translateX(-50%);width:min(760px,calc(100% - 150px));text-align:center;padding:12px 18px 14px;border-radius:22px;background:linear-gradient(135deg,rgba(9,28,68,.88),rgba(48,31,92,.82));border:1px solid rgba(190,222,255,.35);box-shadow:0 12px 40px rgba(0,0,0,.28);backdrop-filter:blur(14px)}
      .eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:#bde9ff;font-weight:900}.goal-title{font-size:clamp(22px,3vw,34px);line-height:1.1;margin:2px 0}.goal-copy{font-size:13px;color:#e7efff}
      .meter-row{display:flex;align-items:center;gap:12px;margin-top:9px}.meter{height:18px;flex:1;padding:3px;border-radius:999px;background:rgba(2,10,31,.72);border:1px solid rgba(255,255,255,.18);overflow:hidden}.meter-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#77d9ff,#a785ff 58%,#ffd86f);box-shadow:0 0 18px rgba(141,210,255,.8);transition:width .55s cubic-bezier(.2,.8,.2,1)}.meter-count{font-size:15px;font-weight:900;white-space:nowrap}.next-copy{font-size:11px;color:#c9d6fa;margin-top:5px}
      .currency{position:absolute;z-index:21;top:20px;left:20px;display:flex;gap:8px}.chip{padding:9px 13px;border-radius:999px;background:rgba(10,24,62,.82);border:1px solid rgba(190,224,255,.28);box-shadow:0 7px 22px rgba(0,0,0,.22);font-weight:900}.chip span{color:#ffe080}.chip-button{color:#fff}.chip-button:hover{filter:brightness(1.13);transform:translateY(-1px)}
      .dragon-name-badge{position:absolute;z-index:21;top:70px;left:20px;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;background:linear-gradient(135deg,rgba(85,190,255,.82),rgba(128,94,255,.78));border:1px solid rgba(220,245,255,.38);box-shadow:0 8px 25px rgba(0,0,0,.24);font-weight:1000;letter-spacing:.01em}
      .needs-panel{position:absolute;z-index:21;top:116px;left:20px;width:210px;padding:10px 12px;border-radius:17px;background:rgba(10,24,62,.72);border:1px solid rgba(190,224,255,.22);backdrop-filter:blur(10px)}
      .need-row{display:grid;grid-template-columns:72px 1fr 34px;align-items:center;gap:7px;font-size:12px;font-weight:900;margin:5px 0}.need-track{height:10px;border-radius:999px;background:rgba(3,12,35,.75);overflow:hidden}.need-fill{height:100%;border-radius:999px;transition:width .35s ease}.need-hunger{background:linear-gradient(90deg,#49e3a1,#ffe77a)}.need-happy{background:linear-gradient(90deg,#ff7bd4,#ffe278)}
      .teacher-button{position:absolute;z-index:30;right:18px;top:18px;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(11,28,68,.86);color:#fff;font-size:21px;box-shadow:0 8px 25px rgba(0,0,0,.3)}
      .reward-ready{position:absolute;z-index:25;right:22px;top:42%;padding:15px 20px;border:0;border-radius:20px;background:linear-gradient(135deg,#ffe36e,#ff9f68);color:#492357;font-weight:900;box-shadow:0 0 0 5px rgba(255,222,99,.16),0 0 36px rgba(255,207,76,.7);animation:rewardPulse 1.8s ease-in-out infinite}
      @keyframes rewardPulse{50%{transform:scale(1.055);filter:brightness(1.08)}}
      .bottom-bar{position:absolute;z-index:24;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:9px;padding:8px;border-radius:18px;background:rgba(7,18,48,.72);border:1px solid rgba(180,220,255,.23);backdrop-filter:blur(12px)}
      .soft-btn,.primary-btn,.award-btn{border:0;border-radius:13px;padding:10px 14px;font-weight:900;color:#fff;background:rgba(73,102,173,.8)}.primary-btn{background:linear-gradient(135deg,#8f72ff,#4bbfe9)}.soft-btn:hover,.primary-btn:hover,.award-btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
      .cost-btn small{display:block;font-size:10px;opacity:.82;margin-top:1px}.tap-prompt{position:absolute;z-index:45;left:50%;top:43%;transform:translate(-50%,-50%);padding:18px 24px;border:0;border-radius:999px;background:linear-gradient(135deg,#fff4a8,#ff8ed1);color:#4e266b;font-weight:1000;font-size:20px;box-shadow:0 0 0 8px rgba(255,255,255,.14),0 12px 40px rgba(0,0,0,.3);animation:tapPulse 1s ease-in-out infinite}.tap-prompt::after{content:'';position:absolute;inset:-18px;border-radius:999px;border:2px dashed rgba(255,255,255,.7)}@keyframes tapPulse{50%{transform:translate(-50%,-50%) scale(1.05)}}.heart-pop{position:absolute;z-index:44;left:50%;top:40%;font-size:38px;animation:heartPop 1.4s ease-out forwards;pointer-events:none}@keyframes heartPop{to{opacity:0;transform:translate(-50%,-95px) scale(1.5)}}
      .world-slot{position:absolute;z-index:5;pointer-events:none}.moon-egg-area{right:10%;bottom:17%;width:150px;height:180px;display:grid;place-items:end center}.egg-nest{position:absolute;bottom:0;width:130px;height:34px;border-radius:50%;background:radial-gradient(ellipse,#7b5e86,#3a315b 65%,transparent 70%);box-shadow:0 8px 22px rgba(0,0,0,.35)}.moon-egg{position:absolute;bottom:20px;width:82px;height:112px;border-radius:52% 48% 48% 52%/64% 62% 38% 36%;background:radial-gradient(circle at 33% 27%,#fff,#cdd9ff 32%,#8d7bd2 68%,#4d3b92);border:2px solid rgba(255,255,255,.55);box-shadow:0 0 calc(10px + var(--egg-stage)*7px) rgba(166,194,255,calc(.25 + var(--egg-stage)*.11));transform:rotate(-4deg)}.moon-egg.stage-1{animation:eggWiggle 2.8s ease-in-out infinite}.moon-egg.stage-2,.moon-egg.stage-3,.moon-egg.stage-4{animation:eggWiggle 1.8s ease-in-out infinite}.moon-egg::after{content:'';position:absolute;inset:0;background:linear-gradient(145deg,transparent 36%,rgba(55,41,117,.75) 37% 39%,transparent 40%)}.moon-egg.stage-0::after,.moon-egg.stage-1::after{display:none}.moon-egg.stage-3::before,.moon-egg.stage-4::before{content:'';position:absolute;inset:18px 11px;background:linear-gradient(36deg,transparent 42%,#62509f 43% 46%,transparent 47%)}@keyframes eggWiggle{0%,88%,100%{transform:rotate(-4deg)}92%{transform:rotate(2deg)}96%{transform:rotate(-8deg)}}
      .hatched-shell{position:absolute;bottom:18px;width:110px;height:55px;border-radius:15% 15% 55% 55%;background:linear-gradient(#a99adf,#5e4a9e);box-shadow:0 0 24px #8abfff}.companion{position:absolute;bottom:65px;font-size:58px;filter:drop-shadow(0 0 18px #9ceaff);animation:floaty 2.2s ease-in-out infinite}@keyframes floaty{50%{transform:translateY(-9px)}}.lantern{left:9%;bottom:18%;font-size:62px;filter:drop-shadow(0 0 15px #ffc55e)}
      .world-flash{position:absolute;z-index:18;inset:0;pointer-events:none;background:radial-gradient(circle at 78% 70%,rgba(255,247,170,.56),transparent 25%);animation:worldFlash 1.5s ease-out forwards}@keyframes worldFlash{to{opacity:0;transform:scale(1.1)}}.toast{position:absolute;z-index:60;left:50%;bottom:100px;transform:translateX(-50%);padding:12px 18px;border-radius:16px;background:#fff;color:#402c70;font-weight:900;box-shadow:0 12px 35px rgba(0,0,0,.35);animation:toastIn 2.4s ease forwards}@keyframes toastIn{0%{opacity:0;transform:translate(-50%,20px)}15%,75%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-12px)}}
      .modal{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(2,8,27,.72);backdrop-filter:blur(8px)}.panel{width:min(720px,96vw);max-height:90vh;overflow:auto;padding:24px;border-radius:24px;background:linear-gradient(145deg,#172f68,#3b286f);border:1px solid rgba(255,255,255,.24);box-shadow:0 25px 80px rgba(0,0,0,.55)}.panel h2{margin:0 0 6px;font-size:28px}.panel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.award-btn{text-align:left;padding:15px;background:linear-gradient(135deg,rgba(105,126,238,.95),rgba(106,70,178,.95));font-size:15px}.award-btn strong{font-size:22px;margin-right:7px}.panel-section{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.16)}.settings-grid{display:grid;gap:11px;margin-top:12px}.toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:9px 0}.setting-card{display:grid;grid-template-columns:minmax(150px,1fr) minmax(170px,260px);align-items:center;gap:14px;padding:12px 14px;border-radius:17px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}.setting-card label,.setting-card span{font-weight:1000}.setting-card input,.setting-card select{width:100%;min-height:42px;border:1px solid rgba(214,235,255,.38);border-radius:13px;padding:8px 12px;background:rgba(8,20,55,.72);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);outline:none}.setting-card input:focus,.setting-card select:focus{border-color:#9be7ff;box-shadow:0 0 0 3px rgba(119,217,255,.18),inset 0 1px 0 rgba(255,255,255,.12)}.setting-card select{appearance:none;background-image:linear-gradient(45deg,transparent 50%,#d9f3ff 50%),linear-gradient(135deg,#d9f3ff 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 12px) 18px;background-size:6px 6px,6px 6px;background-repeat:no-repeat}.close{float:right;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:20px}.choice-card{border:1px solid rgba(255,255,255,.26);border-radius:18px;padding:20px;background:rgba(255,255,255,.1);color:#fff;font-weight:900;font-size:18px}.choice-card .icon{display:block;font-size:50px;margin-bottom:8px}.event-stage{text-align:center;min-height:290px;display:grid;place-items:center}.event-icon{font-size:92px;filter:drop-shadow(0 0 25px #bceaff)}.scrapbook-card,.shop-card,.history-row{padding:15px;border-radius:16px;background:rgba(255,255,255,.09);margin-top:10px}.debug-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      @media(max-width:760px){.story-hud{top:70px;width:calc(100% - 24px);padding:10px}.story-hud.is-disabled{display:none}.goal-title{font-size:21px}.goal-copy{display:none}.currency{top:12px;left:12px}.dragon-name-badge{top:58px;left:12px}.needs-panel{top:98px;left:12px;width:190px}.teacher-button{top:12px;right:12px}.moon-egg-area{right:2%;bottom:15%;transform:scale(.74)}.bottom-bar{width:calc(100% - 20px);justify-content:center;bottom:8px}.bottom-bar button{padding:9px;font-size:12px}.reward-ready{right:10px;top:auto;bottom:75px}.panel{padding:18px}.panel-grid{grid-template-columns:1fr}.debug-grid{grid-template-columns:1fr 1fr}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
    `;
    document.head.appendChild(style);
  }

  private render(): void {
    this.container.innerHTML = `
      <main class="adventure-shell">
        <div class="habitat">
          <div class="pet-avatar" id="petAvatar" aria-label="${this.state.dragonName}, the class dragon"></div>
          <div id="worldSlots"></div>
        </div>
        <div class="currency">
          <button class="chip chip-button" id="starChipButton" aria-label="Open reward points panel">⭐ <span id="starCount"></span></button>
          <div class="chip">🪙 <span id="coinCount"></span></div>
        </div>
        <div class="dragon-name-badge">🐉 <span id="dragonNameBadge"></span></div>
        <div class="needs-panel" aria-label="Dragon needs">
          <div class="need-row"><span>🍓 Hunger</span><div class="need-track"><div class="need-fill need-hunger" id="hungerFill"></div></div><span id="hungerCount"></span></div>
          <div class="need-row"><span>💖 Happy</span><div class="need-track"><div class="need-fill need-happy" id="happyFill"></div></div><span id="happyCount"></span></div>
        </div>
        <section class="story-hud" aria-live="polite">
          <div class="eyebrow">Today's Adventure</div>
          <div class="goal-title" id="goalTitle"></div>
          <div class="goal-copy" id="goalCopy"></div>
          <div class="meter-row">
            <div class="meter"><div class="meter-fill" id="meterFill"></div></div>
            <div class="meter-count" id="meterCount"></div>
          </div>
          <div class="next-copy" id="nextCopy"></div>
        </section>
        <button class="teacher-button" id="teacherButton" aria-label="Open teacher award controls">🔒</button>
        <button class="reward-ready" id="rewardReadyButton" hidden>✨ Reward Ready</button>
        <nav class="bottom-bar">
          <button class="primary-btn cost-btn" id="feedButton">🍓 Feed Berry<small>10 Stars</small></button>
          <button class="primary-btn cost-btn" id="playButton">⚽ Play<small>10 Stars</small></button>
          <button class="primary-btn cost-btn" id="petButton">🤲 Pet<small>10 Stars</small></button>
          <button class="soft-btn" id="moreButton">More</button>
        </nav>
      </main>
    `;
    this.renderer = new Pet3DRenderer('petAvatar', { walkSpeed: 1 });
    void this.renderer.loadPet('dragon').then(() => {
      this.renderer?.setAnimationsPaused(this.state.animationsPaused);
      void this.loadAdventureAssets();
    });
    this.bindMainControls();
    this.updateHud();
    this.updateWorld();
  }

  private bindMainControls(): void {
    document.getElementById('teacherButton')?.addEventListener('click', () => this.showTeacherPanel());
    document.getElementById('starChipButton')?.addEventListener('click', () => this.showAwardPanel());
    document.getElementById('feedButton')?.addEventListener('click', () => void this.handleFeedButton());
    document.getElementById('playButton')?.addEventListener('click', () => void this.handlePlayButton());
    document.getElementById('petButton')?.addEventListener('click', () => this.showPetPrompt());
    document.getElementById('rewardReadyButton')?.addEventListener('click', () => this.showRewardChoice());
    document.getElementById('moreButton')?.addEventListener('click', () => this.showMorePanel());
  }

  private updateHud(): void {
    const goal = getGoalDefinition(this.state.currentGoal);
    this.setText('starCount', String(this.state.classStars));
    this.setText('coinCount', String(this.state.dragonCoins));
    this.setText('dragonNameBadge', this.state.dragonName);
    this.setText('hungerCount', `${Math.round(this.state.petHunger)}%`);
    this.setText('happyCount', `${Math.round(this.state.petHappiness)}%`);
    const hungerFill = document.getElementById('hungerFill') as HTMLElement | null;
    const happyFill = document.getElementById('happyFill') as HTMLElement | null;
    if (hungerFill) hungerFill.style.width = `${this.state.petHunger}%`;
    if (happyFill) happyFill.style.width = `${this.state.petHappiness}%`;
    this.setText('goalTitle', goal.title);
    this.setText('goalCopy', goal.description);
    this.setText('meterCount', `${this.state.adventureMeterValue} / ${this.state.adventureMeterTarget} Stars`);
    const fill = document.getElementById('meterFill') as HTMLElement | null;
    if (fill) fill.style.width = `${Math.min(100, this.state.adventureMeterValue / this.state.adventureMeterTarget * 100)}%`;
    const next = goal.milestones.find((milestone) => milestone.stars > this.state.adventureMeterValue);
    this.setText('nextCopy', next
      ? `${next.stars - this.state.adventureMeterValue} more Stars until ${next.label.toLowerCase()}`
      : this.state.completedAdventures.includes(goal.id)
        ? 'The class hatched the Moon Egg. This habitat remembers.'
        : 'The Moon Egg is ready. Start the reward when the class is ready.');
    const ready = document.getElementById('rewardReadyButton') as HTMLButtonElement | null;
    if (ready) ready.hidden = !this.state.teacherSettings.adventureEnabled || !this.state.rewardReady;
    const storyHud = document.querySelector('.story-hud') as HTMLElement | null;
    storyHud?.classList.toggle('is-disabled', !this.state.teacherSettings.adventureEnabled);
    if (storyHud) storyHud.hidden = !this.state.teacherSettings.adventureEnabled;
    SoundEffects.setSoundEffectsMuted(this.state.quietMode || this.state.teacherSettings.sfxMuted);
    SoundEffects.setBackgroundMusicMuted(this.state.quietMode || this.state.teacherSettings.musicMuted);
    this.renderer?.setAnimationsPaused(this.state.animationsPaused);
  }

  private updateWorld(): void {
    const slots = document.getElementById('worldSlots');
    if (!slots) return;
    if (!this.state.teacherSettings.adventureEnabled) {
      slots.innerHTML = '';
      if (this.using3DAdventureAssets) {
        this.renderer?.setSceneAssetVisible('moon_nest', false);
        this.renderer?.setSceneAssetVisible('moon_egg', false);
        this.renderer?.setSceneAssetVisible('moon_unicorn_01', false);
      }
      return;
    }
    if (!this.assetManifest && this.renderer) {
      void this.loadAdventureAssets();
      return;
    }
    if (this.using3DAdventureAssets) {
      slots.innerHTML = '';
      void this.syncAdventureAssets();
      return;
    }
    const stage = this.state.environmentProgress.moonEggStage;
    const hatched = stage === 5;
    slots.innerHTML = `
      <div class="world-slot moon-egg-area">
        <div class="egg-nest"></div>
        ${hatched
          ? `<div class="hatched-shell"></div><div class="companion" title="Pip the Moon Unicorn">🦄</div>`
          : `<div class="moon-egg stage-${stage}" style="--egg-stage:${stage}" aria-label="Moon Egg stage ${stage}"></div>`}
      </div>
      ${this.state.environmentProgress.slots.lantern ? '<div class="world-slot lantern" title="Magical Moon Lantern">🏮</div>' : ''}
    `;
  }

  private async loadAdventureAssets(): Promise<void> {
    try {
      await this.loadAssetManifest();
      if (!this.state.teacherSettings.adventureEnabled) {
        this.using3DAdventureAssets = false;
        this.updateWorld();
        return;
      }
      this.using3DAdventureAssets = true;
      await this.ensureSceneAsset('moon_nest');
      await this.ensureSceneAsset('moon_egg');
      await this.syncAdventureAssets();
      this.updateWorld();
    } catch (error) {
      console.warn('Adventure 3D assets unavailable; keeping CSS fallback world slots.', error);
      this.using3DAdventureAssets = false;
      this.updateWorld();
    }
  }

  private async loadAssetManifest(): Promise<void> {
    if (this.assetManifest) return;
    const response = await fetch(publicAsset('models/classroom-adventure-assets.manifest.json'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    this.assetManifest = await response.json() as AdventureAssetManifest;
  }

  private async ensureSceneAsset(assetId: string): Promise<void> {
    if (!this.assetManifest) await this.loadAssetManifest();
    if (this.loadedSceneAssets.has(assetId)) return;
    const asset = this.assetManifest?.assets[assetId];
    if (!asset || asset.status === 'fail') return;
    await this.renderer?.loadSceneAsset(assetId, publicAsset(asset.model_file), this.assetTransform(asset));
    this.loadedSceneAssets.add(assetId);
    if (asset.idle_action) {
      this.renderer?.playSceneAssetAnimation(assetId, asset.idle_action, true);
    }
  }

  private assetTransform(asset: AdventureAssetDefinition): SceneAssetTransform {
    return {
      position: asset.position,
      rotation: asset.rotation,
      scale: asset.scale,
    };
  }

  private async syncAdventureAssets(): Promise<void> {
    if (!this.state.teacherSettings.adventureEnabled) {
      this.renderer?.setSceneAssetVisible('moon_nest', false);
      this.renderer?.setSceneAssetVisible('moon_egg', false);
      this.renderer?.setSceneAssetVisible('moon_unicorn_01', false);
      return;
    }
    if (!this.using3DAdventureAssets || !this.assetManifest || !this.renderer) return;
    await this.ensureSceneAsset('moon_nest');
    await this.ensureSceneAsset('moon_egg');

    const stage = this.state.environmentProgress.moonEggStage;
    const egg = this.assetManifest.assets.moon_egg;
    const visibility = egg.stage_visibility?.[String(stage)] ?? egg.stage_visibility?.['0'];
    this.renderer.setSceneAssetVisible('moon_nest', true);
    this.renderer.setSceneAssetVisible('moon_egg', true);
    if (visibility) {
      this.renderer.setSceneAssetObjectVisibility(
        'moon_egg',
        visibility.show ?? [],
        visibility.hide ?? [],
      );
    }

    const hasUnicorn = this.state.unlockedItems.includes('moon_unicorn_01')
      || this.state.environmentProgress.slots.companion === 'moon_unicorn_01';
    if (hasUnicorn) {
      await this.ensureSceneAsset('moon_unicorn_01');
      this.renderer.setSceneAssetVisible('moon_unicorn_01', true);
      this.renderer.playSceneAssetAnimation('moon_unicorn_01', 'MoonUnicorn_Idle_Loop', true);
    } else {
      this.renderer.setSceneAssetVisible('moon_unicorn_01', false);
    }

    const hasLantern = this.state.unlockedItems.includes('magic_moon_lantern')
      || this.state.environmentProgress.slots.lantern === 'magic_moon_lantern';
    if (hasLantern) {
      await this.ensureSceneAsset('magic_moon_lantern');
      this.renderer.setSceneAssetVisible('magic_moon_lantern', true);
      this.renderer.setSceneAssetObjectVisibility('magic_moon_lantern', ['MagicLantern_Glow'], []);
    } else {
      this.renderer.setSceneAssetVisible('magic_moon_lantern', false);
    }
  }

  private setMoonEggStage(stage: 0 | 1 | 2 | 3 | 4 | 5): void {
    const visibility = this.assetManifest?.assets.moon_egg?.stage_visibility?.[String(stage)];
    if (!visibility) return;
    this.renderer?.setSceneAssetObjectVisibility('moon_egg', visibility.show ?? [], visibility.hide ?? []);
  }

  private showAwardPanel(): void {
    const modal = this.makeModal('Award Class Stars', `
      <p>Choose one reason. The award is saved immediately.</p>
      <div class="panel-grid">
        ${this.state.teacherSettings.awardReasons.map(({ amount, reason }) => `
          <button class="award-btn" data-award="${amount}" data-reason="${reason}">
            <strong>+${amount}</strong>${reason}
          </button>
        `).join('')}
      </div>
    `);
    modal.querySelectorAll<HTMLButtonElement>('[data-award]').forEach((button) => {
      button.addEventListener('click', () => {
        const amount = Number(button.dataset.award);
        const reason = button.dataset.reason ?? 'Class reward';
        modal.remove();
        this.awardStars(amount, reason);
      });
    });
  }

  private awardStars(amount: number, reason: string): void {
    const result = classroomAdventureStore.awardStars(amount, reason);
    this.toast(`+${amount} Stars · ${reason}`);
    this.worldFlash();
    if (this.using3DAdventureAssets) {
      this.renderer?.pulseSceneAsset('moon_egg', result.reachedMilestones.length > 0 ? 1500 : 850);
      if (result.reachedMilestones.length > 0) this.renderer?.pulseSceneAsset('moon_nest', 1000);
    }
    if (!this.state.quietMode && !this.state.animationsPaused) {
      const options: PetAnimation[] = result.reachedMilestones.includes(10)
        ? ['play']
        : result.reachedMilestones.length > 0
          ? ['idle_head_look', 'idle_inspect_paw']
          : ['idle_head_look', 'idle_eye_squint', 'idle_inspect_paw'];
      const available = options.filter((item) => item !== this.lastReaction);
      const reaction = available[Math.floor(Math.random() * available.length)] ?? options[0];
      this.lastReaction = reaction;
      this.renderer?.playAnimation(reaction);
      SoundEffects.playSuccessSound();
    }
  }

  private showTeacherPanel(): void {
    const history = this.state.awardHistory.slice(0, 6);
    const queuedActivity = this.state.queuedRewards.find((reward) => reward.type === 'activity');
    const modal = this.makeModal('Teacher Controls', `
      <button class="primary-btn" id="teacherAward">⭐ Award Stars</button>
      <button class="soft-btn" id="homeDashboard">🏠 Back to Game Time Home</button>
      <div class="panel-section">
        <div class="settings-grid">
          <div class="toggle-row"><span>Adventure mode</span><button class="soft-btn" id="adventureToggle">${this.state.teacherSettings.adventureEnabled ? 'On' : 'Off'}</button></div>
          <div class="toggle-row"><span>Quiet mode</span><button class="soft-btn" id="quietToggle">${this.state.quietMode ? 'On' : 'Off'}</button></div>
          <div class="toggle-row"><span>Background music</span><button class="soft-btn" id="musicToggle">${this.state.teacherSettings.musicMuted ? 'Muted' : 'On'}</button></div>
          <div class="toggle-row"><span>Sound effects</span><button class="soft-btn" id="sfxToggle">${this.state.teacherSettings.sfxMuted ? 'Muted' : 'On'}</button></div>
          <div class="toggle-row"><span>Pause animations</span><button class="soft-btn" id="animationToggle">${this.state.animationsPaused ? 'Paused' : 'Playing'}</button></div>
          <div class="setting-card"><label for="rewardMode">Reward mode</label>
            <select id="rewardMode">
              ${(['teacher_choice','class_vote','automatic','surprise'] as RewardMode[]).map((mode) => `<option value="${mode}" ${this.state.rewardMode === mode ? 'selected' : ''}>${mode.replace('_',' ')}</option>`).join('')}
            </select>
          </div>
          <div class="setting-card"><label for="dailyTarget">Daily target</label><input id="dailyTarget" type="number" min="5" max="100" value="${this.state.adventureMeterTarget}"></div>
          <div class="setting-card"><label for="className">Class name</label><input id="className" value="${this.state.className}"></div>
          <div class="setting-card"><label for="dragonName">Dragon name</label><input id="dragonName" value="${this.state.dragonName}"></div>
        </div>
        <button class="soft-btn" id="saveSettings">Save settings</button>
        <button class="soft-btn" id="undoAward">↶ Undo last award</button>
        ${queuedActivity ? '<button class="primary-btn" id="startActivity">🌙 Start small class choice</button>' : ''}
        ${this.state.rewardReady ? '<button class="primary-btn" id="startReward">✨ Start available reward</button><button class="soft-btn" id="saveReward">Save reward for later</button>' : ''}
      </div>
      <div class="panel-section"><strong>Recent history</strong>
        ${history.map((entry) => `<div class="history-row">${entry.amount > 0 ? '+' : ''}${entry.amount} · ${entry.reason}</div>`).join('') || '<p>No awards yet.</p>'}
      </div>
      <div class="panel-section">
        <details><summary>Developer / demo tools</summary>
          <div class="debug-grid">
            <button class="soft-btn" data-debug-stars="5">Jump to 5</button>
            <button class="soft-btn" data-debug-stars="10">Jump to 10</button>
            <button class="soft-btn" data-debug-stars="15">Jump to 15</button>
            <button class="soft-btn" data-debug-stars="20">Reward ready</button>
            <button class="soft-btn" id="completeDebug">Complete adventure</button>
            <button class="soft-btn" id="resetDemo">Reset demo</button>
          </div>
        </details>
      </div>
    `);
    modal.querySelector('#teacherAward')?.addEventListener('click', () => { modal.remove(); this.showAwardPanel(); });
    modal.querySelector('#homeDashboard')?.addEventListener('click', () => {
      window.location.href = new URL('../../index.html', window.location.href).href;
    });
    modal.querySelector('#adventureToggle')?.addEventListener('click', () => {
      classroomAdventureStore.setAdventureEnabled(!this.state.teacherSettings.adventureEnabled);
      modal.remove();
      this.toast(!this.state.teacherSettings.adventureEnabled ? 'Adventure mode on' : 'Adventure mode off');
      void this.loadAdventureAssets();
    });
    modal.querySelector('#quietToggle')?.addEventListener('click', () => { classroomAdventureStore.setQuietMode(!this.state.quietMode); modal.remove(); this.showTeacherPanel(); });
    modal.querySelector('#musicToggle')?.addEventListener('click', () => { classroomAdventureStore.setMusicMuted(!this.state.teacherSettings.musicMuted); modal.remove(); this.showTeacherPanel(); });
    modal.querySelector('#sfxToggle')?.addEventListener('click', () => { classroomAdventureStore.setSfxMuted(!this.state.teacherSettings.sfxMuted); modal.remove(); this.showTeacherPanel(); });
    modal.querySelector('#animationToggle')?.addEventListener('click', () => { classroomAdventureStore.setAnimationsPaused(!this.state.animationsPaused); modal.remove(); this.showTeacherPanel(); });
    modal.querySelector('#rewardMode')?.addEventListener('change', (event) => classroomAdventureStore.setRewardMode((event.target as HTMLSelectElement).value as RewardMode));
    modal.querySelector('#saveSettings')?.addEventListener('click', () => {
      classroomAdventureStore.setDailyTarget(Number((modal.querySelector('#dailyTarget') as HTMLInputElement).value));
      classroomAdventureStore.updateNames(
        (modal.querySelector('#className') as HTMLInputElement).value,
        (modal.querySelector('#dragonName') as HTMLInputElement).value,
      );
      modal.remove();
      this.toast('Teacher settings saved');
    });
    modal.querySelector('#undoAward')?.addEventListener('click', () => {
      const undone = classroomAdventureStore.undoLastAward();
      modal.remove();
      this.toast(undone ? 'Last award undone' : 'No award available to undo');
    });
    modal.querySelector('#startReward')?.addEventListener('click', () => { modal.remove(); this.showRewardChoice(); });
    modal.querySelector('#startActivity')?.addEventListener('click', () => {
      modal.remove();
      this.showMilestoneActivity(queuedActivity!.id);
    });
    modal.querySelector('#saveReward')?.addEventListener('click', () => { classroomAdventureStore.saveRewardForLater(); modal.remove(); this.toast('Reward saved for later'); });
    modal.querySelectorAll<HTMLButtonElement>('[data-debug-stars]').forEach((button) => button.addEventListener('click', () => {
      classroomAdventureStore.debugSetStars(Number(button.dataset.debugStars));
      modal.remove();
    }));
    modal.querySelector('#completeDebug')?.addEventListener('click', () => { classroomAdventureStore.chooseAdventureOption('warm_crystals'); classroomAdventureStore.completeCurrentAdventure(); modal.remove(); });
    modal.querySelector('#resetDemo')?.addEventListener('click', () => { if (confirm('Reset classroom adventure demo progress? Legacy pet data stays archived.')) { classroomAdventureStore.resetDemo(); modal.remove(); } });
  }

  private showMilestoneActivity(rewardId: string): void {
    const modal = this.makeModal('A Moon Egg Choice', `
      <p>The first crack revealed a little moon magic. Choose a 20-second class response.</p>
      <div class="panel-grid">
        <button class="choice-card" data-mini-action="jumping_jacks"><span class="icon">🙌</span>Dragon stretch</button>
        <button class="choice-card" data-mini-action="idle_head_look"><span class="icon">🌙</span>Silent moon pose</button>
      </div>
    `);
    modal.querySelectorAll<HTMLButtonElement>('[data-mini-action]').forEach((button) => button.addEventListener('click', () => {
      classroomAdventureStore.completeQueuedActivity(rewardId);
      if (!this.state.animationsPaused) {
        this.renderer?.playAnimation(button.dataset.miniAction as PetAnimation);
      }
      modal.remove();
      this.toast('The class choice is complete');
    }));
  }

  private showRewardChoice(): void {
    if (!this.state.rewardReady) {
      this.toast('The next adventure reward is not ready yet.');
      return;
    }
    const goal = getGoalDefinition(this.state.currentGoal);
    const modeLabel = this.state.rewardMode === 'class_vote' ? 'Class Vote' : 'Choose a preparation';
    const modal = this.makeModal(modeLabel, `
      <p>The Moon Egg is ready. How should the class prepare for hatching?</p>
      <div class="panel-grid">
        ${goal.choices.map((choice) => `<button class="choice-card" data-choice="${choice.id}"><span class="icon">${choice.icon}</span>${choice.label}</button>`).join('')}
      </div>
      <p style="opacity:.75">${this.state.rewardMode === 'class_vote' ? 'Ask for a show of hands, then press the winning choice.' : 'The teacher starts the selected class choice.'}</p>
    `);
    modal.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => button.addEventListener('click', () => {
      classroomAdventureStore.chooseAdventureOption(button.dataset.choice!);
      modal.remove();
      this.playHatchEvent();
    }));
  }

  private playHatchEvent(): void {
    const goal = getGoalDefinition(this.state.currentGoal);
    const choice = goal.choices.find((item) => item.id === classroomAdventureStore.getState().activeChoiceId) ?? goal.choices[0];
    const modal = this.makeModal('The Moon Egg Adventure', `
      <div class="event-stage">
        <div><div class="event-icon" id="eventIcon">${choice.icon}</div><h2 id="eventTitle">${choice.label}</h2><p id="eventCopy">${choice.story}</p></div>
      </div>
      <button class="soft-btn" id="skipEvent">Skip to reveal</button>
    `, false);
    const scenes = [
      { icon: choice.icon, title: choice.label, copy: choice.story, animation: 'idle_head_look' as PetAnimation },
      { icon: '🥚', title: 'The egg is shaking!', copy: 'Silver cracks race across the glowing shell.', animation: 'idle_failed_fire' as PetAnimation },
      { icon: '✨', title: 'A burst of moonlight!', copy: 'The whole habitat sparkles as the shell opens.', animation: 'jumping_jacks' as PetAnimation },
      { icon: '🦄', title: 'Meet Pip!', copy: 'A tiny Moon Unicorn has joined the class habitat forever.', animation: 'play' as PetAnimation },
    ];
    let index = 0;
    const showScene = () => {
      const scene = scenes[index];
      this.setTextWithin(modal, 'eventIcon', scene.icon);
      this.setTextWithin(modal, 'eventTitle', scene.title);
      this.setTextWithin(modal, 'eventCopy', scene.copy);
      if (!this.state.animationsPaused) this.renderer?.playAnimation(scene.animation);
      if (index === 1) {
        this.setMoonEggStage(4);
        this.renderer?.pulseSceneAsset('moon_egg', 1800);
      }
      if (index === 2) {
        this.setMoonEggStage(4);
        this.renderer?.playSceneAssetAnimation('moon_egg', 'MoonEgg_Hatch', false);
        this.renderer?.pulseSceneAsset('moon_egg', 2600);
      }
      if (index === scenes.length - 1) {
        classroomAdventureStore.completeCurrentAdventure();
        this.setMoonEggStage(5);
        void this.syncAdventureAssets().then(() => {
          this.renderer?.pulseSceneAsset('moon_unicorn_01', 1300);
        });
        const finish = document.createElement('button');
        finish.className = 'primary-btn';
        finish.textContent = 'Return to the habitat';
        finish.addEventListener('click', () => modal.remove());
        modal.querySelector('.panel')?.appendChild(finish);
        return;
      }
      index += 1;
      this.eventTimers.push(window.setTimeout(showScene, this.state.teacherSettings.reducedMotion ? 800 : 4200));
    };
    modal.querySelector('#skipEvent')?.addEventListener('click', () => {
      this.clearEventTimers();
      index = scenes.length - 1;
      showScene();
      (modal.querySelector('#skipEvent') as HTMLElement).remove();
    });
    showScene();
  }

  private showScrapbook(): void {
    this.makeModal('Adventure Scrapbook', this.state.scrapbookEntries.length
      ? this.state.scrapbookEntries.map((entry) => `
        <article class="scrapbook-card">
          <h3>${entry.icon} ${entry.title}</h3>
          <p>${entry.story}</p>
          <small>${new Date(entry.completedAt).toLocaleDateString()} · ${entry.choiceLabel} · +${entry.coinsEarned} Coins</small>
        </article>
      `).join('')
      : '<p>The first page is waiting for the class Moon Egg adventure.</p>');
  }

  private showShop(): void {
    const modal = this.makeModal('Habitat Shop', `
      <p>Dragon Coins come from adventures. Purchases are permanent and never random.</p>
      ${HABITAT_SHOP_ITEMS.map((item) => {
        const owned = this.state.unlockedItems.includes(item.id);
        return `<article class="shop-card"><h3>${item.icon} ${item.name}</h3><p>${item.description}</p><strong>${item.cost} Coins</strong><br><button class="primary-btn" data-buy="${item.id}" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button></article>`;
      }).join('')}
      <p>Balance: ${this.state.dragonCoins} Dragon Coins</p>
    `);
    modal.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((button) => button.addEventListener('click', () => {
      const result = classroomAdventureStore.purchaseItem(button.dataset.buy!);
      modal.remove();
      this.toast(result.message);
    }));
  }

  private showMorePanel(): void {
    const actions: Array<[string, PetAnimation]> = [
      ['Feed', 'feed'], ['Play', 'play'], ['Rest', 'rest'], ['Dance', 'dance'],
      ['Sneeze', 'sneeze'], ['Jumping Jacks', 'jumping_jacks'],
      ['Inspect Paw', 'idle_inspect_paw'], ['Chase Tail', 'idle_chase_tail'],
      ['Sit', 'idle_sit_down'], ['Failed Fire', 'idle_failed_fire'],
    ];
    const modal = this.makeModal('More', `
      <p>Legacy pet interactions and animation tests remain here during migration.</p>
      <div class="debug-grid">
        <button class="soft-btn" id="teacherAwardMore">Award Stars</button>
        <button class="soft-btn" id="scrapbookMore">Scrapbook</button>
        <button class="soft-btn" id="shopMore">Habitat Shop</button>
        <button class="soft-btn" id="feedMagicalBerry">Feed Magical Berry</button>
        ${actions.map(([label, action]) => `<button class="soft-btn" data-animation="${action}">${label}</button>`).join('')}
      </div>
      <div class="panel-section"><button class="soft-btn" id="selectPet">Select legacy pet</button></div>
    `);
    modal.querySelector('#teacherAwardMore')?.addEventListener('click', () => { modal.remove(); this.showAwardPanel(); });
    modal.querySelector('#scrapbookMore')?.addEventListener('click', () => { modal.remove(); this.showScrapbook(); });
    modal.querySelector('#shopMore')?.addEventListener('click', () => { modal.remove(); this.showShop(); });
    modal.querySelector('#feedMagicalBerry')?.addEventListener('click', () => {
      void this.playMagicalBerryFeed();
      modal.remove();
    });
    modal.querySelectorAll<HTMLButtonElement>('[data-animation]').forEach((button) => button.addEventListener('click', () => {
      const animation = button.dataset.animation as PetAnimation;
      this.renderer?.playAnimation(animation);
      if (animation === 'sneeze') SoundEffects.playDragonSneeze();
      if (animation === 'jumping_jacks') SoundEffects.playJumpingJacks();
      modal.remove();
    }));
  }

  private async handleFeedButton(): Promise<void> {
    const result = classroomAdventureStore.feedDragon();
    if (!result.ok) {
      this.toast(result.message);
      return;
    }
    this.toast('10 Stars spent · Magical Berry');
    SoundEffects.playDragonEat();
    await this.playMagicalBerryFeed();
  }

  private async handlePlayButton(): Promise<void> {
    if (this.soccerActive) {
      this.toast('The dragon is already chasing the ball.');
      return;
    }
    const result = classroomAdventureStore.playWithDragon();
    if (!result.ok) {
      this.toast(result.message);
      this.renderer?.playAnimation(result.hungry ? 'hungry' : 'idle_head_look');
      return;
    }
    this.toast('10 Stars spent · Play time');
    await this.playSoccerPasses();
  }

  private showPetPrompt(): void {
    if (this.petPromptActive) return;
    this.petPromptActive = true;
    const prompt = document.createElement('button');
    prompt.className = 'tap-prompt';
    prompt.textContent = `Tap here to pat ${this.state.dragonName}`;
    prompt.addEventListener('click', () => {
      prompt.remove();
      this.petPromptActive = false;
      this.handlePetTap();
    }, { once: true });
    this.container.querySelector('.adventure-shell')?.appendChild(prompt);
    window.setTimeout(() => {
      if (!prompt.isConnected) return;
      prompt.remove();
      this.petPromptActive = false;
    }, 5000);
  }

  private handlePetTap(): void {
    const result = classroomAdventureStore.petDragon();
    if (!result.ok) {
      this.toast(result.message);
      this.renderer?.playAnimation(result.hungry ? 'hungry' : 'idle_head_look');
      return;
    }
    this.renderer?.playAnimation('pet');
    SoundEffects.playDragonCoo();
    this.toast(`${this.state.dragonName} gives a happy little coo.`);
    this.spawnHearts();
  }

  private spawnHearts(): void {
    ['💖', '✨', '💜'].forEach((symbol, index) => {
      const heart = document.createElement('div');
      heart.className = 'heart-pop';
      heart.textContent = symbol;
      heart.style.marginLeft = `${(index - 1) * 34}px`;
      heart.style.animationDelay = `${index * 90}ms`;
      this.container.querySelector('.adventure-shell')?.appendChild(heart);
      window.setTimeout(() => heart.remove(), 1600);
    });
  }

  private async playSoccerPasses(): Promise<void> {
    this.soccerActive = true;
    try {
      await this.ensureSceneAsset('fantasy_soccer_ball');
      if (!this.renderer) throw new Error('Renderer unavailable.');
      this.renderer.setSceneAssetVisible('fantasy_soccer_ball', true);
      const dragonFoot: SceneAssetTransform = {
        position: [0.24, -1.19, 0.62],
        rotation: [0, 0, 0],
        scale: 0.92,
      };
      const screenPoint: SceneAssetTransform = {
        position: [0.02, -0.72, 1.46],
        rotation: [Math.PI * 1.4, Math.PI * 0.3, Math.PI * 2.1],
        scale: 1.18,
      };
      this.renderer.setSceneAssetTransform('fantasy_soccer_ball', dragonFoot);
      for (let pass = 0; pass < 3; pass += 1) {
        this.renderer.playAnimation('soccer_kick');
        await this.sleep(720);
        SoundEffects.playSoccerKick();
        await this.animateSceneAsset('fantasy_soccer_ball', dragonFoot, screenPoint, 850);
        await this.waitForKickBack(pass + 1);
        await this.animateSceneAsset('fantasy_soccer_ball', screenPoint, dragonFoot, 700);
        if (pass < 2) {
          this.renderer.playAnimation('idle_head_look');
          await this.sleep(300);
        }
      }
      this.renderer.playAnimation('jumping_jacks');
      SoundEffects.playJumpingJacks();
      await this.sleep(1800);
    } catch (error) {
      console.warn('Could not play soccer interaction:', error);
      this.renderer?.playAnimation('play');
    } finally {
      this.renderer?.setSceneAssetVisible('fantasy_soccer_ball', false);
      this.soccerActive = false;
    }
  }

  private waitForKickBack(passNumber: number): Promise<void> {
    return new Promise((resolve) => {
      const prompt = document.createElement('button');
      prompt.className = 'tap-prompt';
      prompt.textContent = `Tap to kick it back! ${passNumber}/3`;
      const finish = () => {
        prompt.remove();
        resolve();
      };
      prompt.addEventListener('click', finish, { once: true });
      this.container.querySelector('.adventure-shell')?.appendChild(prompt);
      window.setTimeout(() => {
        if (prompt.isConnected) finish();
      }, 3600);
    });
  }

  private animateSceneAsset(
    id: string,
    from: SceneAssetTransform,
    to: SceneAssetTransform,
    durationMs: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const fromPos = from.position ?? [0, 0, 0];
      const toPos = to.position ?? fromPos;
      const fromRot = from.rotation ?? [0, 0, 0];
      const toRot = to.rotation ?? fromRot;
      const fromScale = typeof from.scale === 'number' ? from.scale : 1;
      const toScale = typeof to.scale === 'number' ? to.scale : fromScale;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const lerp = (a: number, b: number) => a + (b - a) * eased;
        this.renderer?.setSceneAssetTransform(id, {
          position: [
            lerp(fromPos[0], toPos[0]),
            lerp(fromPos[1], toPos[1]),
            lerp(fromPos[2], toPos[2]),
          ],
          rotation: [
            lerp(fromRot[0], toRot[0]) + t * Math.PI * 2.5,
            lerp(fromRot[1], toRot[1]) + t * Math.PI * 1.4,
            lerp(fromRot[2], toRot[2]),
          ],
          scale: lerp(fromScale, toScale),
        });
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private async playMagicalBerryFeed(): Promise<void> {
    if (this.berryFeedActive) {
      this.toast('The dragon is already nibbling.');
      return;
    }
    this.berryFeedActive = true;
    this.clearBerryTimers();
    try {
      await this.ensureSceneAsset('magic_berry');
      const berry = this.assetManifest?.assets.magic_berry;
      if (!berry || !this.renderer) throw new Error('Magic berry asset is unavailable.');
      this.renderer.setSceneAssetVisible('magic_berry', true);
      this.setBerryState('MagicBerry_Full');
      this.renderer.setSceneAssetTransform('magic_berry', {
        position: [-0.31, -0.82, 0.78],
        rotation: [0.28, -0.28, 0.42],
        scale: 2.35,
      });
      this.renderer.playAnimation('feed');
      const timing = berry.event_timing?.Pet_Eat_Talk;
      const durationMs = 3000;
      const events = timing?.events ?? [];
      events.forEach((event) => {
        const timer = window.setTimeout(() => {
          if (event.state) this.setBerryState(event.state);
          if (event.event === 'berry_bite_1') {
            this.renderer?.setSceneAssetTransform('magic_berry', {
              position: [-0.18, -0.28, 0.86],
              rotation: [0.12, -0.08, 0.18],
              scale: 2.35,
            });
          }
          if (event.event === 'berry_bite_2') {
            this.renderer?.setSceneAssetTransform('magic_berry', {
              position: [-0.09, -0.16, 0.88],
              rotation: [0.04, 0.05, -0.02],
              scale: 2.28,
            });
          }
          if (event.event === 'berry_bite_3') {
            this.renderer?.setSceneAssetTransform('magic_berry', {
              position: [-0.02, -0.10, 0.86],
              rotation: [-0.02, 0.14, -0.16],
              scale: 2.12,
            });
          }
          if (event.event === 'berry_hide') {
            this.renderer?.setSceneAssetVisible('magic_berry', false);
            this.berryFeedActive = false;
          }
        }, Math.max(0, event.normalizedTime) * durationMs);
        this.berryTimers.push(timer);
      });
      const cleanupTimer = window.setTimeout(() => {
        this.renderer?.setSceneAssetVisible('magic_berry', false);
        this.berryFeedActive = false;
      }, durationMs + 750);
      this.berryTimers.push(cleanupTimer);
    } catch (error) {
      console.warn('Could not play Magical Berry feed:', error);
      this.renderer?.playAnimation('feed');
      this.berryFeedActive = false;
    }
  }

  private setBerryState(stateName: string): void {
    const states = this.assetManifest?.assets.magic_berry?.available_states ?? [];
    const hide = states.filter((state) => state !== stateName);
    this.renderer?.setSceneAssetObjectVisibility('magic_berry', [stateName], hide);
  }

  private clearBerryTimers(): void {
    this.berryTimers.forEach((timer) => window.clearTimeout(timer));
    this.berryTimers = [];
  }

  private makeModal(title: string, body: string, dismissible = true): HTMLElement {
    document.querySelectorAll('.modal').forEach((existing) => existing.remove());
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<section class="panel" role="dialog" aria-modal="true" aria-label="${title}">${dismissible ? '<button class="close" aria-label="Close">×</button>' : ''}<h2>${title}</h2>${body}</section>`;
    document.body.appendChild(modal);
    modal.querySelector('.close')?.addEventListener('click', () => { this.clearEventTimers(); modal.remove(); });
    return modal;
  }

  private handleShortcut = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (event.key === 'Escape') {
      this.clearEventTimers();
      document.querySelectorAll('.modal').forEach((modal) => modal.remove());
      return;
    }
    if (['1', '2', '3', '5'].includes(event.key)) {
      this.awardStars(Number(event.key), `Keyboard award +${event.key}`);
      return;
    }
    if (event.key.toLowerCase() === 'm') {
      classroomAdventureStore.setQuietMode(!this.state.quietMode);
      this.toast(this.state.quietMode ? 'Quiet mode on' : 'Quiet mode off');
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (this.state.rewardReady) this.showRewardChoice();
      else this.showAwardPanel();
    }
  };

  private toast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.container.querySelector('.adventure-shell')?.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2500);
  }

  private worldFlash(): void {
    const flash = document.createElement('div');
    flash.className = 'world-flash';
    this.container.querySelector('.adventure-shell')?.appendChild(flash);
    window.setTimeout(() => flash.remove(), 1600);
  }

  private clearEventTimers(): void {
    this.eventTimers.forEach((timer) => window.clearTimeout(timer));
    this.eventTimers = [];
  }

  private setText(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  private setTextWithin(root: Element, id: string, value: string): void {
    const element = root.querySelector(`#${id}`);
    if (element) element.textContent = value;
  }
}
