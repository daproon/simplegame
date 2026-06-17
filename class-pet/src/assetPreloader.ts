import { publicAsset } from './publicAsset';

export interface PreloadAssetResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface PreloadProgress {
  completed: number;
  total: number;
  currentUrl: string;
  result?: PreloadAssetResult;
}

export interface PreloadSummary {
  completed: number;
  total: number;
  failed: PreloadAssetResult[];
  cancelled: boolean;
}

const CACHE_NAME = 'class-pet-assets-v2';
const PRELOAD_TIMEOUT_MS = 12000;

const CORE_PUBLIC_ASSETS = [
  'favicon.svg',
  'icons.svg',
  'models/baby-dragon-production.glb',
  'models/dragon-environment.glb',
  'models/baby-dragon-production.manifest.json',
  'models/classroom-adventure-assets.manifest.json',
  'models/magic-berry.glb',
  'models/fantasy-soccer-ball.glb',
  'models/moon-nest.glb',
  'models/moon-egg.glb',
  'models/moon-unicorn.glb',
  'models/magic-lantern.glb',
  'audio/dragon/baby-dragon-coo.mp3',
  'audio/dragon/baby-dragon-sneeze.mp3',
  'audio/dragon/happy-chirrup-01.ogg',
  'audio/dragon/happy-chirrup-02.ogg',
  'audio/dragon/happy-chirrup-03.ogg',
  'audio/fx/light-footsteps.mp3',
  'audio/fx/slow-creaky-step.mp3',
  'audio/fx/soccer-ball-kick.mp3',
  'audio/music/classroom-fantasy-theme.mp3',
];

export async function registerAssetServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register(publicAsset('class-pet-sw.js'));
    await navigator.serviceWorker.ready;
    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } catch (error) {
    console.warn('Class Pet asset service worker unavailable.', error);
  }
}

export function getClassPetAssetUrls(): string[] {
  const urls = new Set<string>();
  urls.add(new URL(window.location.href).href);

  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((script) => {
    urls.add(new URL(script.src, window.location.href).href);
  });
  document.querySelectorAll<HTMLLinkElement>('link[href]').forEach((link) => {
    if (['stylesheet', 'icon'].includes(link.rel)) {
      urls.add(new URL(link.href, window.location.href).href);
    }
  });

  CORE_PUBLIC_ASSETS.forEach((assetPath) => {
    urls.add(new URL(publicAsset(assetPath), window.location.href).href);
  });

  return Array.from(urls);
}

export async function preloadClassPetAssets(
  urls: string[],
  signal: AbortSignal,
  onProgress: (progress: PreloadProgress) => void,
): Promise<PreloadSummary> {
  const cache = await openCacheIfAvailable();
  const failed: PreloadAssetResult[] = [];
  let completed = 0;

  for (const url of urls) {
    if (signal.aborted) {
      return { completed, total: urls.length, failed, cancelled: true };
    }

    const result = await fetchAndCache(url, signal, cache);
    completed += 1;
    if (!result.ok) failed.push(result);
    onProgress({ completed, total: urls.length, currentUrl: url, result });
  }

  return { completed, total: urls.length, failed, cancelled: signal.aborted };
}

async function openCacheIfAvailable(): Promise<Cache | null> {
  if (!('caches' in window)) return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch (error) {
    console.warn('Could not open Class Pet asset cache.', error);
    return null;
  }
}

async function fetchAndCache(
  url: string,
  parentSignal: AbortSignal,
  cache: Cache | null,
): Promise<PreloadAssetResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PRELOAD_TIMEOUT_MS);
  const abortParent = () => controller.abort();
  parentSignal.addEventListener('abort', abortParent, { once: true });

  try {
    const response = await fetch(url, {
      cache: 'reload',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok) {
      return { url, ok: false, status: response.status, error: `HTTP ${response.status}` };
    }
    if (cache) await cache.put(url, response.clone());
    return { url, ok: true, status: response.status };
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? 'Timed out or cancelled'
      : error instanceof Error
        ? error.message
        : 'Unknown download error';
    return { url, ok: false, error: message };
  } finally {
    window.clearTimeout(timeoutId);
    parentSignal.removeEventListener('abort', abortParent);
  }
}
