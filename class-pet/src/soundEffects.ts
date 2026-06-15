import type { PetType } from './types';
import { publicAsset } from './publicAsset';

export class SoundEffects {
  private static audioContext: AudioContext | null = null;
  private static sfxMuted = false;
  private static musicMuted = false;
  private static backgroundMusic: HTMLAudioElement | null = null;
  private static lastDragonVoiceIndex = -1;
  private static readonly dragonVoiceUrls = [
    publicAsset('audio/dragon/baby-dragon-coo.mp3'),
    publicAsset('audio/dragon/happy-chirrup-01.ogg'),
    publicAsset('audio/dragon/happy-chirrup-02.ogg'),
    publicAsset('audio/dragon/happy-chirrup-03.ogg'),
  ];

  static initialize() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  /**
   * Play cute animal sounds using Web Audio API
   */
  static playAnimalSound(petType: PetType) {
    if (this.sfxMuted) return;
    if (!this.audioContext) this.initialize();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (petType) {
      case 'dog':
        this.playDogBark(ctx, now);
        break;
      case 'cat':
        this.playCatMeow(ctx, now);
        break;
      case 'unicorn':
        this.playUnicornWhinny(ctx, now);
        break;
      case 'dragon':
        this.playDragonVoice(ctx, now);
        break;
      case 'phoenix':
        this.playPhoenixCry(ctx, now);
        break;
      case 'trex':
        this.playTRexRoar(ctx, now);
        break;
      case 'triceratops':
        this.playTriceratopsHonk(ctx, now);
        break;
      case 'stegosaurus':
        this.playStegosaurusCall(ctx, now);
        break;
      case 'pterodactyl':
        this.playPterodactylScreech(ctx, now);
        break;
    }
  }

  private static playDogBark(ctx: AudioContext, now: number) {
    // Cute happy dog bark
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.15);

    // Second bark
    const osc2 = ctx.createOscillator();
    osc2.connect(gain);
    osc2.frequency.setValueAtTime(900, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(700, now + 0.3);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.35);
  }

  private static playCatMeow(ctx: AudioContext, now: number) {
    // Cute cat meow
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.16);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private static playUnicornWhinny(ctx: AudioContext, now: number) {
    // Magical unicorn whinny
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);

    // Add shimmer
    const osc2 = ctx.createOscillator();
    osc2.connect(gain);
    osc2.frequency.setValueAtTime(4000, now);
    osc2.frequency.exponentialRampToValueAtTime(3000, now + 0.25);
    osc2.start(now);
    osc2.stop(now + 0.25);
  }

  private static playDragonVoice(ctx: AudioContext, now: number) {
    let index = Math.floor(Math.random() * this.dragonVoiceUrls.length);
    if (this.dragonVoiceUrls.length > 1 && index === this.lastDragonVoiceIndex) {
      index = (index + 1) % this.dragonVoiceUrls.length;
    }
    this.lastDragonVoiceIndex = index;

    const voice = new Audio(this.dragonVoiceUrls[index]);
    voice.volume = 0.72;
    voice.playbackRate = 0.97 + Math.random() * 0.06;
    voice.play().catch(() => this.playDragonVoiceFallback(ctx, now));
  }

  static playDragonCoo() {
    this.playAudioEffect(publicAsset('audio/dragon/baby-dragon-coo.mp3'), 0.72);
  }

  static playDragonEat() {
    this.playAudioEffect(publicAsset('audio/fx/slow-creaky-step.mp3'), 0.56);
  }

  static playDragonSneeze() {
    this.playAudioEffect(publicAsset('audio/dragon/baby-dragon-sneeze.mp3'), 0.75);
  }

  static playSoccerKick() {
    this.playAudioEffect(publicAsset('audio/fx/soccer-ball-kick.mp3'), 0.72);
  }

  static playLightFootsteps() {
    this.playAudioEffect(publicAsset('audio/fx/light-footsteps.mp3'), 0.55);
  }

  static playJumpingJacks() {
    this.playAudioEffect(publicAsset('audio/fx/light-footsteps.mp3'), 0.48);
  }

  private static playAudioEffect(url: string, volume = 0.7) {
    if (this.sfxMuted) return;
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => undefined);
  }

  private static playDragonVoiceFallback(ctx: AudioContext, now: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private static playPhoenixCry(ctx: AudioContext, now: number) {
    // Majestic phoenix cry
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(2500, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  private static playTRexRoar(ctx: AudioContext, now: number) {
    // Terrifying T-Rex roar
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);

    // Add rumble
    const osc2 = ctx.createOscillator();
    osc2.connect(filter);
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    osc2.start(now);
    osc2.stop(now + 0.6);
  }

  private static playTriceratopsHonk(ctx: AudioContext, now: number) {
    // Triceratops honk call
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.2);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  private static playStegosaurusCall(ctx: AudioContext, now: number) {
    // Stegosaurus long call
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  private static playPterodactylScreech(ctx: AudioContext, now: number) {
    // Pterodactyl piercing screech
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(2500, now + 0.3);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  static playSuccessSound(ctx?: AudioContext) {
    if (this.sfxMuted) return;
    if (!this.audioContext) this.initialize();
    const context = ctx || this.audioContext;
    if (!context) return;

    const now = context.currentTime;
    const notes = [800, 1000, 1200];

    notes.forEach((freq, idx) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);

      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.1);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.1);
    });
  }

  static setMuted(muted: boolean) {
    this.setSoundEffectsMuted(muted);
  }

  static isMuted() {
    return this.sfxMuted;
  }

  static setSoundEffectsMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  static setBackgroundMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted) {
      this.backgroundMusic?.pause();
    } else {
      this.playBackgroundMusic();
    }
  }

  static playBackgroundMusic() {
    if (this.musicMuted) return;
    if (!this.backgroundMusic) {
      this.backgroundMusic = new Audio(publicAsset('audio/music/classroom-fantasy-theme.mp3'));
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.08;
    }
    this.backgroundMusic.play().catch(() => undefined);
  }

  static playCoinSound(ctx?: AudioContext) {
    if (this.sfxMuted) return;
    if (!this.audioContext) this.initialize();
    const context = ctx || this.audioContext;
    if (!context) return;

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}
