import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PetType } from './types';
import { publicAsset } from './publicAsset';

export interface Pet3DRendererOptions {
  walkSpeed?: number;
}

export interface SceneAssetTransform {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

interface SceneAssetEntry {
  group: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  actions: Record<string, THREE.AnimationAction>;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  pulseUntil: number;
  pulseDuration: number;
  glowSeed: number;
}

export type PetAnimation =
  | 'spin'
  | 'bounce'
  | 'dance'
  | 'idle'
  | 'greet'
  | 'feed'
  | 'play'
  | 'rest'
  | 'sneeze'
  | 'pet'
  | 'hungry'
  | 'soccer_kick'
  | 'jumping_jacks'
  | 'idle_inspect_paw'
  | 'idle_chase_tail'
  | 'idle_sit_down'
  | 'idle_head_look'
  | 'idle_eye_squint'
  | 'idle_failed_fire'
  | 'idle_failed_fire_sneeze'
  | 'idle_sneeze_fall'
  | 'idle_recover_from_fall'
  | 'goodbye'
  | 'wait'
  | 'look_around'
  | 'press-up';

type EnvironmentMotion = 'idle' | 'forward' | 'pushups';
type EnvironmentLayerName = 'ENV_Ground' | 'ENV_Path' | 'ENV_Near' | 'ENV_Mid' | 'ENV_Far';
interface EnvironmentLoop {
  nodes: THREE.Object3D[];
  spacing: number;
  speed: number;
  baseY: number[];
  spawnZ: number;
}
interface PetManifestAction {
  action: string;
  loop: boolean;
  duration?: number;
  crossfade_duration?: number;
  ambient_weight?: number;
  minimum_cooldown?: number;
  rare?: boolean;
  recovery_action?: string;
  status?: 'accepted' | 'review' | 'fail';
}
interface PetManifestFxEvent {
  action: string;
  event: string;
  marker: string;
  trigger_frame: number;
  trigger_normalized_time: number;
}
interface PetManifest {
  scale?: number;
  default_rotation?: [number, number, number];
  default_position_offset?: [number, number, number];
  ground_height?: number;
  foot_contact_offset?: number;
  default_idle_action?: string;
  action_mapping?: Record<string, PetManifestAction>;
  recommended_crossfade_duration?: number;
  fx_events?: PetManifestFxEvent[];
}

export class Pet3DRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private model: THREE.Group | null = null;
  private animationId: number | null = null;
  private modelLoader: GLTFLoader;
  private environment: THREE.Group | null = null;
  private environmentLayers = new Map<EnvironmentLayerName, THREE.Object3D>();
  private environmentBasePositions = new Map<EnvironmentLayerName, THREE.Vector3>();
  private environmentLoops: EnvironmentLoop[] = [];
  private environmentMotion: EnvironmentMotion = 'idle';
  private environmentMotionElapsed = 0;
  private environmentMotionDuration = 1;
  private isAnimating: boolean = false;
  private currentPetType: PetType | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private clipActions: Record<string, THREE.AnimationAction> = {};
  private clipActionList: THREE.AnimationAction[] = [];
  private basePosition: THREE.Vector3 = new THREE.Vector3();
  private interactionResetId: number | null = null;
  private dragonBaseYaw: number = 0;
  private walkSpeed: number;
  private rootMotionClipNames: Set<string> = new Set();
  private readonly fixedCameraPosition = new THREE.Vector3(0, 0, 3);
  private readonly ROOT_MOTION_THRESHOLD = 0.1;
  private readonly DRAGON_CLIP_NAMES = [
    'flee_01',
    'greet_01',
    'laugh_02',
    'look_around',
    'press-up',
    'run',
    'wait',
    'wave_goodbye_02',
  ];
  // Animation state machine
  private activeAction: THREE.AnimationAction | null = null;
  private isUserAction: boolean = false;
  private isSleeping: boolean = false;
  private idleTimerId: number | null = null;
  private fxEffectTimerIds: number[] = [];
  private lastSpecialAmbient: string | null = null;
  private lastSpecialAmbientAt = 0;
  private nextSpecialAmbientAt = 0;
  private nextRareAmbientAt = 0;
  private dragonManifest: PetManifest | null = null;
  private sceneAssets = new Map<string, SceneAssetEntry>();
  private readonly AMBIENT_CLIPS = [
    'Pet_Idle_Breathing_Loop',
    'Pet_Idle_Breathing_Loop',
    'Pet_Idle_Breathing_Loop',
    'Pet_Idle_Curious_Loop',
    'Pet_Idle_Breathing_Loop',
    'Face_Blink_Test',
  ];
  private readonly ACTION_CLIPS: Record<string, string[]> = {
    greet:      ['Pet_Happy_Bounce'],
    feed:       ['Pet_Eat_Talk'],
    play:       ['Pet_Happy_Bounce', 'Pet_Tiny_Wing_Flutter'],
    rest:       ['Pet_Sleep_Loop'],
    sneeze:     ['Pet_Sneeze_Spark_Reaction'],
    pet:        ['Pet_Idle_Eye_Squint', 'Pet_Idle_Head_Look'],
    hungry:     ['Pet_Idle_Inspect_Paw', 'Pet_Idle_Head_Look'],
    soccer_kick:['Pet_Soccer_Kick_Left_Test', 'Pet_Happy_Bounce'],
    jumping_jacks: ['Pet_Jumping_Jacks_Test'],
    idle_inspect_paw: ['Pet_Idle_Inspect_Paw'],
    idle_chase_tail: ['Pet_Idle_Chase_Tail'],
    idle_sit_down: ['Pet_Idle_Sit_Down'],
    idle_head_look: ['Pet_Idle_Head_Look'],
    idle_eye_squint: ['Pet_Idle_Eye_Squint'],
    idle_failed_fire: ['Pet_Idle_Failed_Fire'],
    idle_failed_fire_sneeze: ['Pet_Idle_Failed_Fire_Sneeze'],
    idle_sneeze_fall: ['Pet_Idle_Sneeze_Fall'],
    idle_recover_from_fall: ['Pet_Idle_Recover_From_Fall'],
    goodbye:    ['Pet_Tiny_Wing_Flutter'],
    look_around:['Pet_Idle_Breathing_Loop'],
    'press-up': ['Pet_Happy_Bounce'],
    run:        ['Pet_Happy_Bounce'],
    wait:       ['Pet_Idle_Breathing_Loop'],
    idle:       ['Pet_Idle_Breathing_Loop'],
    spin:       ['Pet_Happy_Bounce'],
    bounce:     ['Pet_Happy_Bounce'],
    dance:      ['Pet_Tiny_Wing_Flutter', 'Pet_Happy_Bounce'],
  };

  // Free 3D model URLs from CDN (using free models from various sources)
  private modelUrls: Record<PetType, string> = {
    dog: 'https://models.readyplayer.me/63d995cefdc9e7f0370da11f.glb',
    cat: 'https://models.readyplayer.me/63d9962afdc9e7f037daa61a.glb',
    unicorn: 'https://models.readyplayer.me/63d996a6fdc9e7f037daa7d2.glb',
    dragon: publicAsset('models/baby-dragon-production.glb'),
    phoenix: 'https://cdn.jsdelivr.net/npm/@sketchfab/react-viewer@latest/assets/phoenix.glb',
    trex: 'https://models.readyplayer.me/63d997b8fdc9e7f037daaa8d.glb',
    triceratops: 'https://models.readyplayer.me/63d997dffdc9e7f037daab4e.glb',
    stegosaurus: 'https://models.readyplayer.me/63d997fefdc9e7f037daabb9.glb',
    pterodactyl: 'https://models.readyplayer.me/63d9981bfdc9e7f037daac3f.glb',
  };

  // Fallback to procedural generation if models don't load
  private fallbackModels: Record<PetType, () => THREE.Group> = {
    dog: () => this.createProceduralDog(),
    cat: () => this.createProceduralCat(),
    unicorn: () => this.createProceduralUnicorn(),
    dragon: () => this.createProceduralDragon(),
    phoenix: () => this.createProceduralPhoenix(),
    trex: () => this.createProceduralTRex(),
    triceratops: () => this.createProceduralTriceratops(),
    stegosaurus: () => this.createProceduralStegosaurus(),
    pterodactyl: () => this.createProceduralPterodactyl(),
  };

  constructor(containerId: string, options: Pet3DRendererOptions = {}) {
    this.container = document.getElementById(containerId) || document.body;
    this.modelLoader = new GLTFLoader();
    this.walkSpeed = Math.max(0.1, options.walkSpeed ?? 1);

    // Scene setup — no background colour; canvas is transparent so the
    // CSS fantasy background shows through.
    this.scene = new THREE.Scene();

    // Camera setup
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.copy(this.fixedCameraPosition);

    // Renderer setup — alpha:true + transparent clear so fantasy BG shows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Layer the canvas on top of the CSS background layers
    const cvs = this.renderer.domElement;
    cvs.style.position = 'absolute';
    cvs.style.inset = '0';
    cvs.style.zIndex = '2';
    this.container.appendChild(cvs);

    // Lighting
    const hemisphereLight = new THREE.HemisphereLight(0xb8d2ff, 0x514a73, 1.34);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xc8dcff, 1.95);
    directionalLight.position.set(7.25, 7.8, 2.2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    this.scene.add(directionalLight);

    const fillLight = new THREE.PointLight(0xd7b9ff, 1.45, 14, 2);
    fillLight.position.set(-3.8, 2.2, 4.5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x83bfff, 0.45);
    rimLight.position.set(-3, 4, -4);
    this.scene.add(rimLight);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  async loadPet(petType: PetType): Promise<void> {
    this.currentPetType = petType;

    if (this.model) {
      this.scene.remove(this.model);
    }
    this.removeEnvironment();

    if (this.interactionResetId !== null) {
      window.clearTimeout(this.interactionResetId);
      this.interactionResetId = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
      this.clipActions = {};
    }
    this.rootMotionClipNames.clear();
    this.dragonManifest = null;
    this.dispatchEnvironmentMotion('idle');

    try {
      const [gltf, environmentGltf, manifest] = await Promise.all([
        this.modelLoader.loadAsync(this.modelUrls[petType]),
        petType === 'dragon'
          ? this.modelLoader.loadAsync(publicAsset('models/dragon-environment.glb'))
          : Promise.resolve(null),
        petType === 'dragon'
          ? fetch(publicAsset('models/baby-dragon-production.manifest.json'))
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json() as Promise<PetManifest>;
              })
              .catch((error) => {
                console.warn('Dragon manifest unavailable; using renderer defaults.', error);
                return null;
              })
          : Promise.resolve(null),
      ]);
      this.dragonManifest = manifest;
      if (environmentGltf) this.setupEnvironment(environmentGltf.scene);
      this.model = gltf.scene;
      this.setupModel();
      // setupClipAnimations starts the idle state machine — do NOT call
      // playAnimation after this or it cancels the idle scheduler immediately.
      this.setupClipAnimations(gltf.animations);
    } catch (error) {
      console.warn(`Failed to load model for ${petType}, using procedural:`, error);
      // Fallback to procedural generation
      this.model = this.fallbackModels[petType]();
      this.setupModel();
      this.clipActions = {};
      this.mixer = null;
    }
  }

  async loadSceneAsset(
    id: string,
    modelUrl: string,
    transform: SceneAssetTransform = {},
  ): Promise<void> {
    const existing = this.sceneAssets.get(id);
    if (existing) {
      this.applySceneAssetTransform(existing.group, transform);
      existing.group.visible = true;
      return;
    }

    const gltf = await this.modelLoader.loadAsync(modelUrl);
    const group = gltf.scene;
    group.name = id;
    this.applySceneAssetTransform(group, transform);
    group.traverse((node) => {
      if (id === 'magic_moon_lantern' && node instanceof THREE.Light) {
        node.intensity = 0;
        node.visible = false;
        return;
      }
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      const material = node.material;
      if (Array.isArray(material)) {
        material.forEach((item) => { item.needsUpdate = true; });
      } else if (material) {
        material.needsUpdate = true;
      }
    });
    if (id === 'magic_moon_lantern') {
      const glowLight = new THREE.PointLight(0xffc46a, 0.025, 0.85, 2);
      glowLight.name = 'MagicLantern_RuntimeGlow';
      glowLight.position.set(0, 0.22, 0);
      group.add(glowLight);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xffc46a,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 12), haloMaterial);
      halo.name = 'MagicLantern_RuntimeHalo';
      halo.position.set(0, 0.18, 0);
      group.add(halo);
    }

    const mixer = gltf.animations.length > 0 ? new THREE.AnimationMixer(group) : null;
    const actions: Record<string, THREE.AnimationAction> = {};
    if (mixer) {
      gltf.animations.forEach((clip) => {
        actions[this.normalizeName(clip.name)] = mixer.clipAction(clip);
      });
    }

    this.scene.add(group);
    this.sceneAssets.set(id, {
      group,
      mixer,
      actions,
      basePosition: group.position.clone(),
      baseRotation: group.rotation.clone(),
      pulseUntil: 0,
      pulseDuration: 0,
      glowSeed: Math.random() * Math.PI * 2,
    });
  }

  setSceneAssetVisible(id: string, visible: boolean): void {
    const asset = this.sceneAssets.get(id);
    if (asset) asset.group.visible = visible;
  }

  setSceneAssetTransform(id: string, transform: SceneAssetTransform): void {
    const asset = this.sceneAssets.get(id);
    if (!asset) return;
    this.applySceneAssetTransform(asset.group, transform);
    asset.basePosition.copy(asset.group.position);
    asset.baseRotation.copy(asset.group.rotation);
  }

  setSceneAssetObjectVisibility(id: string, show: string[] = [], hide: string[] = []): void {
    const asset = this.sceneAssets.get(id);
    if (!asset) return;
    const shouldMatch = (nodeName: string, names: string[]) => names.some((name) => (
      nodeName === name || nodeName.startsWith(`${name}.`)
    ));
    asset.group.traverse((node) => {
      if (hide.length > 0 && shouldMatch(node.name, hide)) node.visible = false;
      if (show.length > 0 && shouldMatch(node.name, show)) node.visible = true;
    });
  }

  playSceneAssetAnimation(id: string, actionName: string, loop = false): void {
    const asset = this.sceneAssets.get(id);
    if (!asset?.mixer) return;
    const action = asset.actions[this.normalizeName(actionName)];
    if (!action) {
      console.warn(`Missing scene asset action '${actionName}' on '${id}'.`);
      return;
    }
    Object.values(asset.actions).forEach((candidate) => {
      if (candidate !== action) candidate.stop();
    });
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.fadeIn(0.15).play();
  }

  pulseSceneAsset(id: string, durationMs = 900): void {
    const asset = this.sceneAssets.get(id);
    if (!asset) return;
    asset.pulseDuration = durationMs;
    asset.pulseUntil = performance.now() + durationMs;
  }

  private applySceneAssetTransform(group: THREE.Group, transform: SceneAssetTransform): void {
    if (transform.position) group.position.set(...transform.position);
    if (transform.rotation) group.rotation.set(...transform.rotation);
    if (transform.scale !== undefined) {
      if (Array.isArray(transform.scale)) group.scale.set(...transform.scale);
      else group.scale.setScalar(transform.scale);
    }
  }

  private setupModel(): void {
    if (!this.model) return;

    this.model.scale.set(1, 1, 1);
    this.model.rotation.set(0, 0, 0);
    this.model.position.set(0, 0, 0);
    this.scene.add(this.model);

    // Ensure model fits in view
    this.centerModel();
    this.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = false;
    });
  }

  private setupEnvironment(environment: THREE.Group): void {
    this.removeEnvironment();
    this.environment = environment;
    this.environment.position.y = -0.36;
    this.environmentLayers.clear();
    this.environmentBasePositions.clear();
    this.environmentLoops = [];

    const layerNames: EnvironmentLayerName[] = [
      'ENV_Ground',
      'ENV_Path',
      'ENV_Near',
      'ENV_Mid',
      'ENV_Far',
    ];
    layerNames.forEach((name) => {
      const layer = environment.getObjectByName(name);
      if (!layer) return;
      this.environmentLayers.set(name, layer);
      this.environmentBasePositions.set(name, layer.position.clone());
    });
    const path = this.environmentLayers.get('ENV_Path');
    const near = this.environmentLayers.get('ENV_Near');
    if (path) {
      this.environmentLoops.push(
        this.createEnvironmentLoop(environment, path, 3, 11.5, 4.8),
      );
    }
    if (near) {
      this.environmentLoops.push(
        this.createEnvironmentLoop(environment, near, 4, 7, 6.2),
      );
    }

    environment.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const normalizedName = this.normalizeName(node.name);
      const isGlow = normalizedName.includes('moon')
        || normalizedName.includes('star')
        || normalizedName.includes('firefly');
      node.castShadow = !isGlow;
      node.receiveShadow = !isGlow;
    });

    this.scene.add(environment);
    this.resetEnvironmentLayers();
  }

  private createEnvironmentLoop(
    environment: THREE.Group,
    source: THREE.Object3D,
    count: number,
    spacing: number,
    speed: number,
  ): EnvironmentLoop {
    const nodes = [source];
    for (let index = 1; index < count; index += 1) {
      const clone = source.clone(true);
      clone.name = `${source.name}_Loop_${index}`;
      environment.add(clone);
      nodes.push(clone);
    }

    const baseY = nodes.map((node) => node.position.y);
    const bounds = new THREE.Box3().setFromObject(source);
    const localMinZ = bounds.min.z - source.position.z;
    const spawnZ = this.fixedCameraPosition.z - localMinZ + 0.75;
    const loop = { nodes, spacing, speed, baseY, spawnZ };
    this.resetEnvironmentLoop(loop);
    return loop;
  }

  private resetEnvironmentLoop(loop: EnvironmentLoop): void {
    loop.nodes.forEach((node, index) => {
      node.position.z = loop.spawnZ - loop.spacing * index;
      node.position.y = loop.baseY[index];
      node.scale.set(1, 1, 1);
    });
  }

  private removeEnvironment(): void {
    if (this.environment) this.scene.remove(this.environment);
    this.environment = null;
    this.environmentLayers.clear();
    this.environmentBasePositions.clear();
    this.environmentLoops = [];
  }

  private resetEnvironmentLayers(): void {
    this.environmentLayers.forEach((layer, name) => {
      const base = this.environmentBasePositions.get(name);
      if (!base) return;
      layer.position.copy(base);
      layer.scale.set(1, 1, 1);
    });
    this.environmentLoops.forEach((loop) => this.resetEnvironmentLoop(loop));
  }

  private setupClipAnimations(clips: THREE.AnimationClip[]): void {
    if (!this.model || clips.length === 0) {
      this.clipActions = {};
      this.clipActionList = [];
      this.mixer = null;
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.model);
    this.clipActions = {};
    this.clipActionList = [];

    const namedClips = clips.map((clip, index) => {
      const namedClip = clip.clone();
      if (
        this.currentPetType === 'dragon'
        && this.normalizeName(clip.name).startsWith('nlatrack')
      ) {
        namedClip.name = this.DRAGON_CLIP_NAMES[index] ?? clip.name;
      }
      return namedClip;
    });
    const clipNames = new Set(namedClips.map((clip) => this.normalizeName(clip.name)));
    if (!clipNames.has(this.normalizeName('Pet_Idle_Curious_Loop'))) {
      const customIdle = this.createCuriousIdleClip();
      if (customIdle) namedClips.push(customIdle);
    }
    if (!clipNames.has(this.normalizeName('Pet_Sneeze_Spark_Reaction'))) {
      const sneeze = this.createSneezeClip();
      if (sneeze) namedClips.push(sneeze);
    }
    const sanitizedClips = namedClips.map((clip) => this.removeRootMotion(clip));

    sanitizedClips.forEach((clip) => {
      const action = this.mixer!.clipAction(clip);
      this.clipActions[clip.name.toLowerCase()] = action;
      this.clipActionList.push(action);
    });

    console.info('Dragon/GLB clips detected:', sanitizedClips.map((clip) => ({
      name: clip.name,
      tracks: clip.tracks.map((track) => track.name),
      rootMotionNeutralized: this.rootMotionClipNames.has(this.normalizeName(clip.name)),
    })));

    // Start state machine
    if (this.currentPetType === 'dragon') {
      this.mixer.addEventListener('finished', this.onClipFinished);
      this.startIdleScheduler();
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private isWalkClip(name: string): boolean {
    const n = this.normalizeName(name);
    return n.includes('walk')
      || n.includes('run')
      || n.includes('flee');
  }

  private getEnvironmentMotion(clipName: string): EnvironmentMotion {
    const normalizedName = this.normalizeName(clipName);
    if (normalizedName.includes('run') || normalizedName.includes('flee')) return 'forward';
    if (normalizedName.includes('pressup')) return 'pushups';
    return 'idle';
  }

  private dispatchEnvironmentMotion(
    motion: EnvironmentMotion,
    duration = 0,
  ): void {
    if (motion !== this.environmentMotion) {
      this.environmentMotionElapsed = 0;
    }
    this.environmentMotion = motion;
    this.environmentMotionDuration = Math.max(0.1, duration || 1);
    if (motion === 'idle') {
      this.environmentLoops.forEach((loop) => {
        loop.nodes.forEach((node, index) => {
          node.position.y = loop.baseY[index];
        });
      });
      (['ENV_Ground', 'ENV_Mid', 'ENV_Far'] as EnvironmentLayerName[]).forEach((name) => {
        const layer = this.environmentLayers.get(name);
        const base = this.environmentBasePositions.get(name);
        if (layer && base) layer.position.y = base.y;
      });
    }

    this.container.dispatchEvent(
      new CustomEvent('dragon-environment-motion', {
        bubbles: false,
        detail: { motion, walkSpeed: this.walkSpeed, duration },
      })
    );
  }

  private updateEnvironment(delta: number): void {
    if (!this.environment || this.environmentMotion === 'idle') return;

    this.environmentMotionElapsed += delta;
    if (this.environmentMotion === 'forward') {
      this.environmentLoops.forEach((loop) => {
        const loopLength = loop.spacing * loop.nodes.length;
        const recycleZ = loop.spawnZ - loopLength;
        loop.nodes.forEach((node) => {
          node.position.z -= loop.speed * this.walkSpeed * delta;
          if (node.position.z <= recycleZ) {
            node.position.z += loopLength;
          }
        });
      });
      return;
    }

    const progress = Math.min(
      1,
      this.environmentMotionElapsed / this.environmentMotionDuration,
    );
    const bounce = Math.sin(progress * Math.PI * 4);
    this.environmentLoops.forEach((loop, loopIndex) => {
      const strength = loopIndex === 0 ? 0.12 : 0.08;
      loop.nodes.forEach((node, index) => {
        node.position.y = loop.baseY[index] + bounce * strength;
      });
    });
    (['ENV_Ground', 'ENV_Mid', 'ENV_Far'] as EnvironmentLayerName[]).forEach((name) => {
      const layer = this.environmentLayers.get(name);
      const base = this.environmentBasePositions.get(name);
      if (!layer || !base) return;
      const strength = name === 'ENV_Ground' ? 0.12 : name === 'ENV_Mid' ? 0.035 : 0.012;
      layer.position.y = base.y + bounce * strength;
    });
  }

  setWalkSpeed(walkSpeed: number): void {
    this.walkSpeed = Math.max(0.1, walkSpeed);
    const isWalking = this.currentPetType === 'dragon'
      && this.activeAction !== null
      && this.isWalkClip(this.activeAction.getClip().name);

    if (isWalking) {
      this.activeAction!.setEffectiveTimeScale(this.walkSpeed);
    }
    const clip = this.activeAction?.getClip();
    this.dispatchEnvironmentMotion(
      clip ? this.getEnvironmentMotion(clip.name) : 'idle',
      clip ? clip.duration / this.walkSpeed : 0,
    );
  }

  private removeRootMotion(clip: THREE.AnimationClip): THREE.AnimationClip {
    if (!this.model || this.currentPetType !== 'dragon') return clip;

    const sanitizedClip = clip.clone();
    let hasRootMotion = false;

    sanitizedClip.tracks.forEach((track) => {
      if (!track.name.endsWith('.position')) return;

      const binding = THREE.PropertyBinding.parseTrackName(track.name);
      const nodeName = binding.nodeName;
      if (!nodeName || this.normalizeName(nodeName) !== 'root') return;

      const root = this.model!.getObjectByName(nodeName);
      if (!root || track.getValueSize() !== 3) return;

      const values = track.values;
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;

      for (let index = 0; index < values.length; index += 3) {
        minX = Math.min(minX, values[index]);
        maxX = Math.max(maxX, values[index]);
        minZ = Math.min(minZ, values[index + 2]);
        maxZ = Math.max(maxZ, values[index + 2]);
      }

      const horizontalTravel = Math.hypot(maxX - minX, maxZ - minZ);
      hasRootMotion ||= horizontalTravel > this.ROOT_MOTION_THRESHOLD;

      for (let index = 0; index < values.length; index += 3) {
        values[index] = root.position.x;
        values[index + 2] = root.position.z;
      }
    });

    if (hasRootMotion) {
      this.rootMotionClipNames.add(this.normalizeName(clip.name));
    }

    return sanitizedClip;
  }

  private createCuriousIdleClip(): THREE.AnimationClip | null {
    if (!this.model || this.currentPetType !== 'dragon') return null;

    const times = [0, 1.2, 2.4, 3.6, 4.8];
    const tracks: THREE.QuaternionKeyframeTrack[] = [];
    const addTrack = (nodeName: string, poses: THREE.Euler[]) => {
      const node = this.model!.getObjectByName(nodeName);
      if (!node) return;

      const values: number[] = [];
      poses.forEach((pose) => {
        const rotation = new THREE.Quaternion().setFromEuler(pose);
        const quaternion = node.quaternion.clone().multiply(rotation);
        values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      });
      tracks.push(new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values));
    };

    addTrack('Head', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.06, 0.12, 0.1),
      new THREE.Euler(0.03, -0.08, -0.05),
      new THREE.Euler(-0.04, 0.08, 0.06),
      new THREE.Euler(0, 0, 0),
    ]);
    addTrack('NeckTwist01', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0, 0.06, 0.04),
      new THREE.Euler(0, -0.04, -0.02),
      new THREE.Euler(0, 0.04, 0.03),
      new THREE.Euler(0, 0, 0),
    ]);
    addTrack('Spine02', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0.015, 0, 0),
      new THREE.Euler(-0.01, 0, 0),
      new THREE.Euler(0.012, 0, 0),
      new THREE.Euler(0, 0, 0),
    ]);

    return tracks.length > 0
      ? new THREE.AnimationClip('curious_idle', times[times.length - 1], tracks)
      : null;
  }

  private createSneezeClip(): THREE.AnimationClip | null {
    if (!this.model || this.currentPetType !== 'dragon') return null;

    const times = [0, 0.42, 0.72, 0.9, 1.08, 1.5, 2.1];
    const tracks: THREE.KeyframeTrack[] = [];
    const addTrack = (nodeName: string, poses: THREE.Euler[]) => {
      const node = this.model!.getObjectByName(nodeName);
      if (!node) return;

      const values: number[] = [];
      poses.forEach((pose) => {
        const offset = new THREE.Quaternion().setFromEuler(pose);
        const quaternion = node.quaternion.clone().multiply(offset);
        values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      });
      tracks.push(new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values));
    };
    const head = this.model.getObjectByName('Head');

    // Slow inhale, tiny head shake, sharp forward snap, then a sheepish recovery.
    addTrack('Head', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.1, 0.07, 0.05),
      new THREE.Euler(-0.17, -0.11, -0.08),
      new THREE.Euler(0.25, 0, 0),
      new THREE.Euler(-0.07, 0.06, 0.05),
      new THREE.Euler(0.04, -0.03, -0.02),
      new THREE.Euler(0, 0, 0),
    ]);
    addTrack('NeckTwist01', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.04, 0.03, 0.02),
      new THREE.Euler(-0.09, -0.04, -0.03),
      new THREE.Euler(0.15, 0, 0),
      new THREE.Euler(-0.03, 0.02, 0.02),
      new THREE.Euler(0.02, -0.02, 0),
      new THREE.Euler(0, 0, 0),
    ]);
    addTrack('Spine02', [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.025, 0, 0),
      new THREE.Euler(-0.05, 0, 0),
      new THREE.Euler(0.09, 0, 0),
      new THREE.Euler(-0.02, 0, 0),
      new THREE.Euler(0.01, 0, 0),
      new THREE.Euler(0, 0, 0),
    ]);
    if (head) {
      const baseScale = head.scale;
      const values = [
        baseScale.x, baseScale.y, baseScale.z,
        baseScale.x * 1.03, baseScale.y * 0.96, baseScale.z * 1.02,
        baseScale.x * 1.06, baseScale.y * 0.92, baseScale.z * 1.04,
        baseScale.x * 0.94, baseScale.y * 1.08, baseScale.z * 0.96,
        baseScale.x * 1.03, baseScale.y * 0.96, baseScale.z * 1.02,
        baseScale.x * 0.99, baseScale.y * 1.01, baseScale.z,
        baseScale.x, baseScale.y, baseScale.z,
      ];
      tracks.push(new THREE.VectorKeyframeTrack('Head.scale', times, values));
    }

    return tracks.length > 0
      ? new THREE.AnimationClip('sneeze', times[times.length - 1], tracks)
      : null;
  }

  // ── State machine ──────────────────────────────────────────────────────
  private startIdleScheduler(): void {
    const now = Date.now();
    this.nextSpecialAmbientAt = now + 25000 + Math.random() * 35000;
    this.nextRareAmbientAt = now + 120000 + Math.random() * 180000;
    this.playNextAmbientClip();
    this.scheduleNextIdle();
  }

  private scheduleNextIdle(delayMs?: number): void {
    if (this.idleTimerId !== null) window.clearTimeout(this.idleTimerId);
    const delay = delayMs ?? (8000 + Math.random() * 10000);
    this.idleTimerId = window.setTimeout(() => {
      if (!this.isUserAction && !this.isSleeping) this.playNextAmbientClip();
      this.scheduleNextIdle();
    }, delay);
  }

  // Called when a LoopOnce clip (expression or action) finishes naturally
  private onClipFinished = (event: { type: string; action: THREE.AnimationAction }): void => {
    const clipName = event.action.getClip().name;
    const completedMapping = this.getManifestActionByClip(clipName);
    this.dispatchEnvironmentMotion('idle');
    if (this.isWalkClip(clipName)) {
      return;
    }
    if (completedMapping?.recovery_action) {
      const recovery = this.findClipAction([completedMapping.recovery_action]);
      if (recovery) {
        this.isUserAction = true;
        this.crossFadeTo(recovery, false);
        return;
      }
      console.warn(`Missing recovery action '${completedMapping.recovery_action}'.`);
    }
    this.isUserAction = false;
    this.isSleeping = false;
    this.playNextAmbientClip();
    this.scheduleNextIdle();
  };

  private playNextAmbientClip(): void {
    const mappings = Object.values(this.dragonManifest?.action_mapping ?? {});
    const ambientMappings = mappings.filter((mapping) => (
      (mapping.ambient_weight ?? 0) > 0
      && mapping.status !== 'fail'
      && this.findClipAction([mapping.action]) !== null
    ));
    if (ambientMappings.length > 0) {
      const now = Date.now();
      const eligible = ambientMappings.filter((mapping) => {
        const isBase = mapping.loop;
        if (isBase) return true;
        if (now < this.nextSpecialAmbientAt) return false;
        if (mapping.action === this.lastSpecialAmbient) return false;
        if (mapping.rare && now < this.nextRareAmbientAt) return false;
        const cooldownMs = (mapping.minimum_cooldown ?? 0) * 1000;
        return now - this.lastSpecialAmbientAt >= cooldownMs;
      });
      const pool = eligible.length > 0
        ? eligible
        : ambientMappings.filter((mapping) => mapping.loop);
      const totalWeight = pool.reduce((sum, mapping) => sum + (mapping.ambient_weight ?? 0), 0);
      let roll = Math.random() * totalWeight;
      const chosen = pool.find((mapping) => {
        roll -= mapping.ambient_weight ?? 0;
        return roll <= 0;
      }) ?? pool[0];
      const action = chosen ? this.findClipAction([chosen.action]) : null;
      if (action && chosen) {
        if (!chosen.loop) {
          this.isUserAction = true;
          this.lastSpecialAmbient = chosen.action;
          this.lastSpecialAmbientAt = now;
          this.nextSpecialAmbientAt = now + 25000 + Math.random() * 35000;
          if (chosen.rare) {
            this.nextRareAmbientAt = now + 120000 + Math.random() * 180000;
          }
        }
        this.crossFadeTo(action, chosen.loop);
        return;
      }
    }

    const start = Math.floor(Math.random() * this.AMBIENT_CLIPS.length);
    for (let offset = 0; offset < this.AMBIENT_CLIPS.length; offset += 1) {
      const chosen = this.AMBIENT_CLIPS[(start + offset) % this.AMBIENT_CLIPS.length];
      const action = this.findClipAction([chosen]);
      if (!action) continue;
      const shouldLoop = this.normalizeName(chosen).includes('loop');
      this.crossFadeTo(action, shouldLoop);
      return;
    }
    console.warn('No ambient dragon animation was available.');
  }

  private crossFadeTo(action: THREE.AnimationAction, shouldLoop: boolean): void {
    this.clearFxEffectTimers();
    const mapping = this.getManifestActionByClip(action.getClip().name);
    const crossfade = mapping?.crossfade_duration
      ?? this.dragonManifest?.recommended_crossfade_duration
      ?? 0.3;
    if (this.activeAction && this.activeAction !== action) {
      this.activeAction.fadeOut(crossfade);
    }
    this.activeAction = action;
    const clipName = action.getClip().name;
    const isWalking = this.isWalkClip(clipName);
    action.reset();
    action.clampWhenFinished = !shouldLoop;
    action.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.setEffectiveTimeScale(isWalking ? this.walkSpeed : 1);
    action.fadeIn(crossfade).play();
    const fxEvents = this.dragonManifest?.fx_events?.filter(
      (candidate) => this.normalizeName(candidate.action) === this.normalizeName(clipName),
    ) ?? [];
    fxEvents.forEach((fxEvent) => {
      const normalizedTime = Math.max(0, Math.min(1, fxEvent.trigger_normalized_time));
      const delayMs = action.getClip().duration * normalizedTime * 1000
        / (isWalking ? this.walkSpeed : 1);
      const timerId = window.setTimeout(() => {
        this.container.dispatchEvent(new CustomEvent('dragon-sneeze', {
          detail: {
            event: fxEvent.event,
            marker: fxEvent.marker,
            action: fxEvent.action,
            triggerFrame: fxEvent.trigger_frame,
          },
        }));
        this.fxEffectTimerIds = this.fxEffectTimerIds.filter((id) => id !== timerId);
      }, delayMs);
      this.fxEffectTimerIds.push(timerId);
    });
    this.dispatchEnvironmentMotion(
      this.getEnvironmentMotion(clipName),
      action.getClip().duration / (isWalking ? this.walkSpeed : 1),
    );
  }

  private centerModel(): void {
    if (!this.model) return;

    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const manifestScale = this.currentPetType === 'dragon'
      ? (this.dragonManifest?.scale ?? 1)
      : 1;
    const targetSize = (this.currentPetType === 'dragon' ? 2.6 : 2.2) * manifestScale;
    const scale = targetSize / maxDim;
    this.model.scale.multiplyScalar(scale);

    if (this.currentPetType === 'dragon') {
      const rotation = this.dragonManifest?.default_rotation ?? [0, this.dragonBaseYaw, 0];
      this.model.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
    const scaledBox = new THREE.Box3().setFromObject(this.model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const offset = this.dragonManifest?.default_position_offset ?? [0, -0.36, 0];
    this.model.position.x += offset[0] - scaledCenter.x;
    const footContactOffset = this.dragonManifest?.foot_contact_offset;
    const groundHeight = this.dragonManifest?.ground_height ?? offset[1];
    this.model.position.y += this.currentPetType === 'dragon' && footContactOffset !== undefined
      ? groundHeight - footContactOffset * scale
      : offset[1] - scaledBox.min.y;
    this.model.position.z += offset[2];

    this.camera.position.copy(this.fixedCameraPosition);
    this.basePosition.copy(this.model.position);
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private getManifestActionByClip(clipName: string): PetManifestAction | undefined {
    return Object.values(this.dragonManifest?.action_mapping ?? {}).find(
      (mapping) => this.normalizeName(mapping.action) === this.normalizeName(clipName),
    );
  }

  private clearFxEffectTimers(): void {
    this.fxEffectTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    this.fxEffectTimerIds = [];
  }

  private findClipAction(keywords: string[]): THREE.AnimationAction | null {
    const entries = Object.entries(this.clipActions);
    if (entries.length === 0) return null;

    for (const keyword of keywords) {
      const normalizedKeyword = this.normalizeName(keyword);

      const exactMatch = entries.find(([name]) => this.normalizeName(name) === normalizedKeyword);
      if (exactMatch) return exactMatch[1];

      const startsWithMatch = entries.find(([name]) => this.normalizeName(name).startsWith(normalizedKeyword));
      if (startsWithMatch) return startsWithMatch[1];

      const match = entries.find(([name]) => this.normalizeName(name).includes(normalizedKeyword));
      if (match) return match[1];
    }

    return null;
  }

  private playDragonRigAnimation(type: PetAnimation): boolean {
    const manifestMapping = this.dragonManifest?.action_mapping?.[type];
    const keywords = manifestMapping
      ? [manifestMapping.action]
      : (this.ACTION_CLIPS[type] ?? this.AMBIENT_CLIPS);
    let action: THREE.AnimationAction | null;
    if (type === 'play') {
      const playClips = keywords
        .map((keyword) => this.findClipAction([keyword]))
        .filter((candidate): candidate is THREE.AnimationAction => candidate !== null);
      action = playClips[Math.floor(Math.random() * playClips.length)] ?? null;
    } else {
      action = this.findClipAction(keywords);
    }
    if (!action && this.clipActionList.length > 0) {
      const idleName = this.dragonManifest?.default_idle_action ?? 'Pet_Idle_Breathing_Loop';
      action = this.findClipAction([idleName]) ?? this.clipActionList[0];
      console.warn(
        `Missing dragon action '${type}' (${keywords.join(', ')}); using '${action.getClip().name}'.`,
      );
    }
    if (!action) return false;

    if (this.interactionResetId !== null) {
      window.clearTimeout(this.interactionResetId);
      this.interactionResetId = null;
    }
    // Pause idle timer while user action is in progress
    if (this.idleTimerId !== null) {
      window.clearTimeout(this.idleTimerId);
      this.idleTimerId = null;
    }

    this.clearFxEffectTimers();

    this.isUserAction = true;
    this.isSleeping = type === 'rest';
    this.crossFadeTo(action, manifestMapping?.loop ?? false);
    return true;
  }

  playAnimation(type: PetAnimation = 'idle'): void {
    if (!this.model) return;

    // Dragon uses rig/skeleton clips only.
    if (this.currentPetType === 'dragon') {
      const played = this.playDragonRigAnimation(type);
      if (!played) {
        console.warn(`No playable rig clip found for dragon action '${type}'.`);
      }
      return;
    }

    if (this.isAnimating) return;
    this.isAnimating = true;

    const startTime = Date.now();
    const duration = type === 'dance' ? 1800 : 900;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (!this.model) return;

      this.model.position.copy(this.basePosition);

      switch (type) {
        case 'greet':
          this.model.rotation.y = this.currentPetType === 'dragon'
            ? this.dragonBaseYaw + Math.sin(progress * Math.PI * 2) * 0.25
            : Math.sin(progress * Math.PI * 2) * 0.25;
          this.model.position.y += Math.abs(Math.sin(progress * Math.PI * 2)) * 0.1;
          break;
        case 'look_around':
          this.model.rotation.y = this.currentPetType === 'dragon'
            ? this.dragonBaseYaw + Math.sin(progress * Math.PI * 2) * 0.45
            : Math.sin(progress * Math.PI * 2) * 0.45;
          break;
        case 'wait':
        case 'idle':
          this.model.position.y += Math.sin(progress * Math.PI * 2) * 0.06;
          this.model.rotation.z = Math.sin(progress * Math.PI) * 0.02;
          break;
        case 'press-up':
          this.model.position.y += Math.abs(Math.sin(progress * Math.PI * 4)) * 0.18;
          this.model.rotation.z = Math.sin(progress * Math.PI * 2) * 0.08;
          break;
        case 'bounce':
          this.model.position.y += Math.sin(progress * Math.PI * 2) * 0.22;
          this.model.rotation.z = Math.sin(progress * Math.PI) * 0.06;
          break;
        case 'dance':
          this.model.rotation.z = Math.sin(progress * Math.PI * 4) * 0.16;
          this.model.position.y += Math.abs(Math.sin(progress * Math.PI * 2)) * 0.15;
          this.model.position.x += Math.sin(progress * Math.PI * 2) * 0.1;
          break;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (this.currentPetType !== 'dragon') {
          this.model.rotation.x = 0;
          this.model.rotation.y = 0;
        } else {
          this.model.rotation.y = this.dragonBaseYaw;
        }
        this.model.rotation.z = 0;
        this.model.position.copy(this.basePosition);
        this.isAnimating = false;
      }
    };

    animate();
  }

  setAnimationsPaused(paused: boolean): void {
    this.clock.running = !paused;
    if (this.mixer) this.mixer.timeScale = paused ? 0 : 1;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (this.mixer) {
      this.mixer.update(delta);
    }
    const now = performance.now();
    this.sceneAssets.forEach((asset) => {
      if (asset.mixer) asset.mixer.update(delta);
      if (asset.group.name === 'magic_moon_lantern' && asset.group.visible) {
        this.updateLanternGlow(asset, now);
      }
      if (asset.pulseUntil > now) {
        const progress = 1 - ((asset.pulseUntil - now) / Math.max(1, asset.pulseDuration));
        const lift = Math.sin(progress * Math.PI * 4) * 0.025;
        const wobble = Math.sin(progress * Math.PI * 8) * 0.055;
        asset.group.position.y = asset.basePosition.y + lift;
        asset.group.rotation.z = asset.baseRotation.z + wobble;
      } else if (asset.pulseUntil !== 0) {
        asset.group.position.copy(asset.basePosition);
        asset.group.rotation.copy(asset.baseRotation);
        asset.pulseUntil = 0;
      }
    });
    this.updateEnvironment(delta);

    // Lock X/Z so root-motion animations (run/flee) don't walk off screen.
    // Allow only a small Y bob from animations.
    if (this.model && this.currentPetType === 'dragon') {
      this.model.position.x = this.basePosition.x;
      this.model.position.z = this.basePosition.z;
      const maxY = this.basePosition.y + 0.55;
      const minY = this.basePosition.y - 0.3;
      this.model.position.y = Math.max(minY, Math.min(maxY, this.model.position.y));
    }

    this.camera.position.copy(this.fixedCameraPosition);
    this.renderer.render(this.scene, this.camera);
  };

  private updateLanternGlow(asset: SceneAssetEntry, now: number): void {
    const seconds = now / 1000;
    const slow = Math.sin(seconds * 0.9 + asset.glowSeed) * 0.06;
    const soft = Math.sin(seconds * 1.7 + asset.glowSeed * 0.37) * 0.035;
    const pulse = Math.max(0, Math.sin(seconds * 0.22 + asset.glowSeed)) ** 8 * 0.12;
    const intensity = 0.45 + slow * 0.55 + soft * 0.5 + pulse * 0.45;
    asset.group.traverse((node) => {
      if (node instanceof THREE.PointLight && node.name === 'MagicLantern_RuntimeGlow') {
        node.intensity = 0.015 + intensity * 0.025;
      }
      if (!(node instanceof THREE.Mesh)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (!material || !('emissiveIntensity' in material)) return;
        const named = material.name.toLowerCase().includes('glow')
          || node.name.toLowerCase().includes('glow');
        if (named) {
          (material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        }
      });
    });
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.interactionResetId !== null) {
      window.clearTimeout(this.interactionResetId);
      this.interactionResetId = null;
    }

    if (this.idleTimerId !== null) {
      window.clearTimeout(this.idleTimerId);
      this.idleTimerId = null;
    }

    this.clearFxEffectTimers();

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.dispatchEnvironmentMotion('idle');
    this.removeEnvironment();
    this.sceneAssets.forEach((asset) => {
      if (asset.mixer) asset.mixer.stopAllAction();
      this.scene.remove(asset.group);
    });
    this.sceneAssets.clear();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // High-quality procedural fallback models with professional detail
  private createProceduralDog(): THREE.Group {
    const group = new THREE.Group();

    // Main body - more detailed capsule
    const bodyGeom = new THREE.CapsuleGeometry(0.32, 0.85, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0xd4a574,
      shininess: 50,
      flatShading: false
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - larger, rounder
    const headGeom = new THREE.IcosahedronGeometry(0.35, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.65;
    group.add(head);

    // Ears - floppy style
    const earGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const ear1 = new THREE.Mesh(earGeom, bodyMat);
    ear1.scale.set(1, 1.3, 0.8);
    ear1.position.set(-0.22, 0.8, -0.15);
    ear1.rotation.z = 0.3;
    group.add(ear1);

    const ear2 = ear1.clone();
    ear2.position.x = 0.22;
    ear2.rotation.z = -0.3;
    group.add(ear2);

    // Snout
    const snoutGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const snoutMat = new THREE.MeshPhongMaterial({ color: 0xc49060 });
    const snout = new THREE.Mesh(snoutGeom, snoutMat);
    snout.scale.set(0.8, 0.6, 0.9);
    snout.position.set(0, 0.5, 0.25);
    group.add(snout);

    // Eyes
    this.addDogEyes(group, 0.08, 0.65, 0.28);

    // Nose
    const noseGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const noseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.5, 0.32);
    group.add(nose);

    // Legs
    this.addLegs(group, 0.12, 0.3, bodyMat);

    // Tail - curved
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.25, -0.3, 0.1),
      new THREE.Vector3(0.35, -0.55, 0.2),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 8, 0.09, 6);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addDogEyes(group: THREE.Group, size: number, y: number, z: number): void {
    const eyeGeom = new THREE.SphereGeometry(size, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.12, y, z);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.6, 12, 12),
      pupilMat
    );
    leftPupil.position.set(-0.12, y, z + 0.08);
    group.add(leftPupil);

    // Right eye
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.12;
    group.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.12;
    group.add(rightPupil);
  }

  private addLegs(group: THREE.Group, radius: number, height: number, material: THREE.Material): void {
    const legGeom = new THREE.CylinderGeometry(radius, radius * 0.8, height, 12);
    const positions = [
      [-0.2, 0],
      [0.2, 0],
      [-0.15, 0.1],
      [0.15, 0.1]
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeom, material);
      leg.position.set(pos[0], -height / 2, pos[1]);
      group.add(leg);
    });
  }

  private createProceduralCat(): THREE.Group {
    const group = new THREE.Group();

    // Body - sleek and curved
    const bodyGeom = new THREE.CapsuleGeometry(0.28, 0.75, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0xff9d5c,
      shininess: 60
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.05;
    group.add(body);

    // Head - round cat face
    const headGeom = new THREE.IcosahedronGeometry(0.32, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.6;
    group.add(head);

    // Ears - pointed and expressive
    const earGeom = new THREE.ConeGeometry(0.1, 0.28, 12);
    const ear1 = new THREE.Mesh(earGeom, bodyMat);
    ear1.position.set(-0.15, 0.8, 0);
    group.add(ear1);

    const ear2 = ear1.clone();
    ear2.position.x = 0.15;
    group.add(ear2);

    // Large cat eyes
    this.addCatEyes(group, 0.1, 0.63, 0.25);

    // Nose - pink
    const noseGeom = new THREE.SphereGeometry(0.05, 10, 10);
    const noseMat = new THREE.MeshPhongMaterial({ color: 0xffb6e8 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.55, 0.28);
    group.add(nose);

    // Whiskers (thin lines)
    this.addWhiskers(group, 0.55);

    // Legs - thin cat legs
    this.addLegs(group, 0.1, 0.28, bodyMat);

    // Tail - long and curved
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(0.3, -0.2, 0.15),
      new THREE.Vector3(0.45, -0.45, 0.3),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 8, 0.08, 6);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addCatEyes(group: THREE.Group, width: number, y: number, z: number): void {
    const eyeGeom = new THREE.SphereGeometry(width, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.1, y, z);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(width * 0.5, 12, 12),
      pupilMat
    );
    leftPupil.position.set(-0.1, y, z + 0.08);
    group.add(leftPupil);

    // Right eye
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.1;
    group.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.1;
    group.add(rightPupil);
  }

  private addWhiskers(group: THREE.Group, y: number): void {
    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    const whiskerPositions = [
      [0.15, 0.2],
      [0.15, 0],
      [0.15, -0.2],
      [-0.15, 0.2],
      [-0.15, 0],
      [-0.15, -0.2],
    ];

    whiskerPositions.forEach((offset) => {
      const points = [
        new THREE.Vector3(offset[0] > 0 ? 0.15 : -0.15, y + offset[1], 0.25),
        new THREE.Vector3(offset[0] > 0 ? 0.35 : -0.35, y + offset[1], 0.28),
      ];
      const whiskerGeom = new THREE.BufferGeometry().setFromPoints(points);
      const whisker = new THREE.Line(whiskerGeom, whiskerMat);
      group.add(whisker);
    });
  }

  private createProceduralUnicorn(): THREE.Group {
    const group = new THREE.Group();

    // Body - elegant
    const bodyGeom = new THREE.CapsuleGeometry(0.32, 0.9, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0xffb6e8,
      shininess: 80
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - graceful
    const headGeom = new THREE.IcosahedronGeometry(0.33, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.65;
    group.add(head);

    // Magical horn - spiraling
    const hornGeom = new THREE.ConeGeometry(0.08, 0.6, 16);
    const hornMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 100 });
    const horn = new THREE.Mesh(hornGeom, hornMat);
    horn.position.y = 0.95;
    group.add(horn);

    // Horn glow effect
    const glowGeom = new THREE.IcosahedronGeometry(0.12, 3);
    const glowMat = new THREE.MeshPhongMaterial({ 
      color: 0xffff99, 
      transparent: true, 
      opacity: 0.3 
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.y = 0.75;
    group.add(glow);

    // Mane - flowing
    this.addMane(group, 0.65, bodyMat);

    // Eyes - magical
    this.addDogEyes(group, 0.09, 0.68, 0.26);

    // Legs
    this.addLegs(group, 0.12, 0.3, bodyMat);

    // Tail - long and flowing
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.2, -0.35, 0.2),
      new THREE.Vector3(0.3, -0.6, 0.4),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 8, 0.1, 6);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addMane(group: THREE.Group, y: number, material: THREE.Material): void {
    for (let i = 0; i < 5; i++) {
      const maneGeom = new THREE.SphereGeometry(0.08, 12, 12);
      const mane = new THREE.Mesh(maneGeom, material);
      mane.position.set(
        Math.sin(i * 0.3) * 0.15,
        y + i * 0.1,
        -0.25 - i * 0.05
      );
      mane.scale.set(1.2, 1.5, 0.8);
      group.add(mane);
    }
  }

  private createProceduralDragon(): THREE.Group {
    const group = new THREE.Group();

    // Body - powerful
    const bodyGeom = new THREE.CapsuleGeometry(0.4, 1.1, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0x4a90e2,
      shininess: 70
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - fierce
    const headGeom = new THREE.IcosahedronGeometry(0.38, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.7;
    group.add(head);

    // Horns - menacing
    const hornGeom = new THREE.ConeGeometry(0.12, 0.35, 16);
    const horn1 = new THREE.Mesh(hornGeom, bodyMat);
    horn1.position.set(-0.2, 0.95, 0);
    horn1.rotation.z = 0.2;
    group.add(horn1);

    const horn2 = horn1.clone();
    horn2.position.x = 0.2;
    horn2.rotation.z = -0.2;
    group.add(horn2);

    // Eyes - glowing
    this.addDragonEyes(group, 0.1, 0.72, 0.3);

    // Spinal ridge
    this.addSpinalRidge(group, bodyMat);

    // Wings - magnificent
    this.addDragonWings(group);

    // Legs - powerful
    this.addLegs(group, 0.15, 0.35, bodyMat);

    // Tail - long and intimidating
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0.3, -0.4, 0.2),
      new THREE.Vector3(0.5, -0.7, 0.4),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 8, 0.12, 8);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addDragonEyes(group: THREE.Group, size: number, y: number, z: number): void {
    const eyeGeom = new THREE.SphereGeometry(size, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff8c00 });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.14, y, z);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.5, 12, 12),
      pupilMat
    );
    leftPupil.position.set(-0.14, y, z + 0.08);
    group.add(leftPupil);

    // Right eye
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.14;
    group.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.14;
    group.add(rightPupil);
  }

  private addSpinalRidge(group: THREE.Group, material: THREE.Material): void {
    for (let i = 0; i < 6; i++) {
      const ridgeGeom = new THREE.ConeGeometry(0.08, 0.2, 8);
      const ridge = new THREE.Mesh(ridgeGeom, material);
      ridge.position.set(0, 0.4 - i * 0.18, -0.25);
      group.add(ridge);
    }
  }

  private addDragonWings(group: THREE.Group): void {
    const wingGeom = new THREE.PlaneGeometry(0.6, 0.9);
    const wingMat = new THREE.MeshPhongMaterial({ 
      color: 0x6bb6ff,
      side: THREE.DoubleSide,
      shininess: 100
    });

    // Left wing
    const wing1 = new THREE.Mesh(wingGeom, wingMat);
    wing1.position.set(-0.55, 0.3, -0.05);
    wing1.rotation.y = 0.3;
    group.add(wing1);

    // Right wing
    const wing2 = wing1.clone();
    wing2.position.x = 0.55;
    wing2.rotation.y = -0.3;
    group.add(wing2);
  }

  private createProceduralPhoenix(): THREE.Group {
    const group = new THREE.Group();

    // Body - elegant
    const bodyGeom = new THREE.CapsuleGeometry(0.35, 0.85, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0xff6b35,
      shininess: 90
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - noble
    const headGeom = new THREE.IcosahedronGeometry(0.32, 4);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xff8c42 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 0.6;
    group.add(head);

    // Crest - flaming
    this.addPhoenixCrest(group);

    // Eyes - piercing
    this.addDogEyes(group, 0.09, 0.63, 0.27);

    // Wings - majestic and fiery
    this.addPhoenixWings(group);

    // Legs
    this.addLegs(group, 0.11, 0.3, bodyMat);

    // Tail - spectacular flames
    this.addPhoenixTail(group);

    return group;
  }

  private addPhoenixCrest(group: THREE.Group): void {
    const colors = [0xff4500, 0xff6347, 0xff8c00];
    for (let i = 0; i < 5; i++) {
      const featherGeom = new THREE.ConeGeometry(0.1, 0.4, 8);
      const featherMat = new THREE.MeshPhongMaterial({ color: colors[i % 3] });
      const feather = new THREE.Mesh(featherGeom, featherMat);
      feather.position.set(
        Math.sin(i * 0.4) * 0.12,
        0.75 + i * 0.08,
        -0.2
      );
      feather.rotation.z = Math.sin(i * 0.3) * 0.3;
      group.add(feather);
    }
  }

  private addPhoenixWings(group: THREE.Group): void {
    const wingGeom = new THREE.PlaneGeometry(0.7, 1);
    const wingMat = new THREE.MeshPhongMaterial({ 
      color: 0xff8c42,
      side: THREE.DoubleSide,
      shininess: 100
    });

    const wing1 = new THREE.Mesh(wingGeom, wingMat);
    wing1.position.set(-0.6, 0.2, -0.1);
    wing1.rotation.y = 0.4;
    group.add(wing1);

    const wing2 = wing1.clone();
    wing2.position.x = 0.6;
    wing2.rotation.y = -0.4;
    group.add(wing2);
  }

  private addPhoenixTail(group: THREE.Group): void {
    const colors = [0xff6b35, 0xff8c42, 0xffa500, 0xffd700];
    for (let i = 0; i < 4; i++) {
      const tailGeom = new THREE.PlaneGeometry(0.3, 0.5);
      const tailMat = new THREE.MeshPhongMaterial({ 
        color: colors[i],
        side: THREE.DoubleSide
      });
      const tail = new THREE.Mesh(tailGeom, tailMat);
      tail.position.set(
        (i - 1.5) * 0.2,
        -0.3 - i * 0.1,
        0.2 + i * 0.1
      );
      tail.rotation.x = 0.3;
      tail.rotation.z = (i - 1.5) * 0.2;
      group.add(tail);
    }
  }

  private createProceduralTRex(): THREE.Group {
    const group = new THREE.Group();

    // Massive body - powerful and muscular
    const bodyGeom = new THREE.CapsuleGeometry(0.5, 1.25, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0x8b4513,
      shininess: 40
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.15;
    body.scale.set(1, 1.2, 1);
    group.add(body);

    // Large fierce head
    const headGeom = new THREE.IcosahedronGeometry(0.42, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.75;
    head.scale.set(1.2, 1.1, 1.3);
    group.add(head);

    // Massive teeth
    this.addTRexTeeth(group);

    // Terrifying eyes
    const eyeGeom = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff4500 });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.18, 0.8, 0.35);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      pupilMat
    );
    leftPupil.position.set(-0.18, 0.8, 0.42);
    group.add(leftPupil);

    const rightEye = leftEye.clone();
    rightEye.position.x = 0.18;
    group.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.18;
    group.add(rightPupil);

    // Powerful legs
    this.addTRexLegs(group, bodyMat);

    // Long intimidating tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0.4, -0.5, -0.1),
      new THREE.Vector3(0.6, -0.9, -0.3),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 10, 0.16, 8);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addTRexTeeth(group: THREE.Group): void {
    const toothGeom = new THREE.ConeGeometry(0.04, 0.15, 8);
    const toothMat = new THREE.MeshPhongMaterial({ color: 0xffffff });

    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(toothGeom, toothMat);
      tooth.position.set(
        -0.15 + i * 0.06,
        0.6,
        0.4
      );
      group.add(tooth);
    }
  }

  private addTRexLegs(group: THREE.Group, material: THREE.Material): void {
    const legGeom = new THREE.CylinderGeometry(0.18, 0.15, 0.4, 12);
    
    const leftLeg = new THREE.Mesh(legGeom, material);
    leftLeg.position.set(-0.2, -0.25, 0);
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.2;
    group.add(rightLeg);

    // Large clawed feet
    const footGeom = new THREE.SphereGeometry(0.15, 12, 12);
    const leftFoot = new THREE.Mesh(footGeom, material);
    leftFoot.position.set(-0.2, -0.45, 0);
    leftFoot.scale.set(1.3, 0.8, 1);
    group.add(leftFoot);

    const rightFoot = leftFoot.clone();
    rightFoot.position.x = 0.2;
    group.add(rightFoot);
  }

  private createProceduralTriceratops(): THREE.Group {
    const group = new THREE.Group();

    // Sturdy body
    const bodyGeom = new THREE.CapsuleGeometry(0.45, 1.05, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0x8b7355,
      shininess: 50
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - wide and defensive
    const headGeom = new THREE.IcosahedronGeometry(0.4, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.6;
    head.scale.set(1.3, 1, 1.2);
    group.add(head);

    // Shield (frill) - distinctive feature
    this.addTriceratopsFrill(group, bodyMat);

    // Three massive horns - golden
    const hornMat = new THREE.MeshPhongMaterial({ 
      color: 0xccaa00,
      shininess: 100
    });

    // Top horn
    const hornGeom = new THREE.ConeGeometry(0.12, 0.5, 12);
    const horn1 = new THREE.Mesh(hornGeom, hornMat);
    horn1.position.set(0, 1.0, 0);
    group.add(horn1);

    // Left horn
    const horn2 = new THREE.Mesh(hornGeom, hornMat);
    horn2.position.set(-0.28, 0.72, 0);
    horn2.rotation.z = 0.2;
    group.add(horn2);

    // Right horn
    const horn3 = horn2.clone();
    horn3.position.x = 0.28;
    horn3.rotation.z = -0.2;
    group.add(horn3);

    // Eyes
    this.addDogEyes(group, 0.09, 0.65, 0.28);

    // Sturdy legs
    this.addLegs(group, 0.16, 0.32, bodyMat);

    // Short tail
    const tailGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.3, 8);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    tail.position.set(0, -0.15, -0.35);
    tail.rotation.z = 0.2;
    group.add(tail);

    return group;
  }

  private addTriceratopsFrill(group: THREE.Group, material: THREE.Material): void {
    for (let i = 0; i < 8; i++) {
      const frillGeom = new THREE.PlaneGeometry(0.25, 0.4);
      const frill = new THREE.Mesh(frillGeom, material);
      const angle = (i / 8) * Math.PI * 2;
      frill.position.set(
        Math.cos(angle) * 0.3,
        0.55 + Math.sin(Math.abs(angle - Math.PI)) * 0.1,
        Math.sin(angle) * 0.3
      );
      frill.rotation.y = angle + Math.PI / 2;
      group.add(frill);
    }
  }

  private createProceduralStegosaurus(): THREE.Group {
    const group = new THREE.Group();

    // Elongated body
    const bodyGeom = new THREE.CapsuleGeometry(0.42, 1.15, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0x9b6b47,
      shininess: 45
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - small and herbivore-like
    const headGeom = new THREE.IcosahedronGeometry(0.32, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.65;
    group.add(head);

    // Distinctive row of plates on back
    this.addStegoPlates(group);

    // Spikes on tail - dangerous
    this.addStegoSpikes(group);

    // Eyes
    this.addDogEyes(group, 0.08, 0.68, 0.26);

    // Legs
    this.addLegs(group, 0.13, 0.3, bodyMat);

    return group;
  }

  private addStegoPlates(group: THREE.Group): void {
    const plateMat = new THREE.MeshPhongMaterial({ 
      color: 0xaa8844,
      shininess: 80
    });

    for (let i = 0; i < 6; i++) {
      const plateGeom = new THREE.PlaneGeometry(0.2, 0.4);
      const plate = new THREE.Mesh(plateGeom, plateMat);
      plate.position.set(0, 0.3 + i * 0.15, -0.3);
      plate.rotation.x = 0.1;
      group.add(plate);
    }
  }

  private addStegoSpikes(group: THREE.Group): void {
    const spikeMat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    for (let i = 0; i < 4; i++) {
      const spikeGeom = new THREE.ConeGeometry(0.08, 0.25, 8);
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      spike.position.set(
        (i - 1.5) * 0.15,
        -0.2 - i * 0.1,
        -0.55
      );
      spike.rotation.x = -0.3;
      group.add(spike);
    }
  }

  private createProceduralPterodactyl(): THREE.Group {
    const group = new THREE.Group();

    // Lightweight body
    const bodyGeom = new THREE.CapsuleGeometry(0.28, 0.65, 8, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ 
      color: 0x9f7f5f,
      shininess: 60
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.1;
    group.add(body);

    // Head - aerodynamic and pointed
    const headGeom = new THREE.IcosahedronGeometry(0.3, 4);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 0.6;
    head.scale.set(0.8, 1.2, 1.3);
    group.add(head);

    // Distinctive crest on head
    const crestGeom = new THREE.ConeGeometry(0.1, 0.4, 12);
    const crest = new THREE.Mesh(crestGeom, bodyMat);
    crest.position.y = 0.82;
    crest.position.z = -0.1;
    group.add(crest);

    // Large impressive wings
    this.addPterodactylWings(group);

    // Eyes - predatory
    const eyeGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.12, 0.65, 0.28);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      pupilMat
    );
    leftPupil.position.set(-0.12, 0.65, 0.35);
    group.add(leftPupil);

    const rightEye = leftEye.clone();
    rightEye.position.x = 0.12;
    group.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.12;
    group.add(rightPupil);

    // Small lightweight legs
    const legGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.25, 8);
    const leftLeg = new THREE.Mesh(legGeom, bodyMat);
    leftLeg.position.set(-0.15, -0.2, 0);
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    group.add(rightLeg);

    // Long pointed tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(0.15, -0.2, 0.1),
      new THREE.Vector3(0.25, -0.5, 0.25),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 8, 0.07, 6);
    const tail = new THREE.Mesh(tailGeom, bodyMat);
    group.add(tail);

    return group;
  }

  private addPterodactylWings(group: THREE.Group): void {
    const wingGeom = new THREE.PlaneGeometry(0.8, 1.2);
    const wingMat = new THREE.MeshPhongMaterial({ 
      color: 0xa8988f,
      side: THREE.DoubleSide,
      shininess: 80
    });

    // Left wing - massive and pteroid-like
    const wing1 = new THREE.Mesh(wingGeom, wingMat);
    wing1.position.set(-0.7, 0.2, -0.1);
    wing1.rotation.y = 0.5;
    wing1.rotation.z = 0.2;
    group.add(wing1);

    // Right wing
    const wing2 = wing1.clone();
    wing2.position.x = 0.7;
    wing2.rotation.y = -0.5;
    wing2.rotation.z = -0.2;
    group.add(wing2);

    // Wing membrane edge details
    const edgeGeom = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 1, -0.1),
        new THREE.Vector3(-0.7, 0.5, -0.1),
        new THREE.Vector3(-0.8, -0.3, -0.2)
      ]),
      6,
      0.02,
      4
    );
    const edge = new THREE.Mesh(edgeGeom, wingMat);
    group.add(edge);

    const edgeGeom2 = edgeGeom.clone();
    const edge2 = new THREE.Mesh(edgeGeom2, wingMat);
    edge2.position.x = 0;
    edge2.scale.x = -1;
    group.add(edge2);
  }
}
