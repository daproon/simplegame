// Copy this file and rename to pet3DModels.config.ts if you want to customize model URLs
// This makes it easy to swap models without editing pet3DRenderer.ts

import type { PetType } from './types';

export const MODEL_URLS: Record<PetType, string> = {
  // ORIGINAL READYPLAYER.ME MODELS (less realistic)
  // dog: 'https://models.readyplayer.me/63d995cefdc9e7f0370da11f.glb',
  // cat: 'https://models.readyplayer.me/63d9962afdc9e7f037daa61a.glb',
  
  // HIGH-QUALITY SKETCHFAB MODELS (replace with your URLs after generation)
  dog: 'https://your-cdn.com/dog.glb', // Replace with Tripo3D generated model
  cat: 'https://your-cdn.com/cat.glb', // Replace with Tripo3D generated model
  unicorn: 'https://your-cdn.com/unicorn.glb',
  dragon: 'https://your-cdn.com/dragon.glb',
  phoenix: 'https://your-cdn.com/phoenix.glb',
  trex: 'https://your-cdn.com/trex.glb',
  triceratops: 'https://your-cdn.com/triceratops.glb',
  stegosaurus: 'https://your-cdn.com/stegosaurus.glb',
  pterodactyl: 'https://your-cdn.com/pterodactyl.glb',
};

// RECOMMENDED HIGH-QUALITY MODEL SOURCES:
// 
// 1. TRIPO3D (Recommended - AI Generated)
//    - Visit: https://www.tripo3d.com
//    - Generate models using prompts from TRIPO3D_PROMPTS.md
//    - Download as GLB
//    - Upload to CDN (Cloudinary, AWS S3, etc)
//    - Copy CDN URLs here
//
// 2. SKETCHFAB FREE MODELS (Realistic alternatives)
//    - https://sketchfab.com/search?q=dog+realistic&type=models&license=free
//    - https://sketchfab.com/search?q=cat+realistic&type=models&license=free
//    - Always check licensing before using
//
// 3. MESHY.AI (Alternative AI Generator)
//    - https://www.meshy.ai/
//    - Similar to Tripo3D
//
// 4. FREE CDN HOSTING OPTIONS:
//    - Cloudinary (free tier: 25GB/month)
//    - AWS S3 (free tier limited)
//    - Vercel Blob Storage
//    - GitHub (for small files)
