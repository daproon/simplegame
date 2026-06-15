# Tripo3D AI Model Generation Prompts

## How to Use Tripo3D

1. Go to: https://www.tripo3d.com
2. Sign up for free account
3. For each pet, use the prompts below to generate realistic 3D models
4. Download as GLB format
5. Host on a CDN or local server

---

## Pet Model Generation Prompts

### Dog - Friendly and Playful
**Prompt:**
"A cute, friendly golden retriever puppy sitting upright. Soft fur with warm golden-brown color, big expressive eyes, floppy ears, small pink nose. Playful expression. Stylized but realistic, high-quality 3D model suitable for a children's educational game. Smooth fur texture, professional lighting. 8K quality."

**Style:** Realistic, warm, friendly
**Export:** GLB format

---

### Cat - Elegant and Mischievous
**Prompt:**
"A charming orange tabby cat sitting proudly. Smooth fur with detailed stripes, bright green expressive eyes, pointed ears, small pink nose, playful expression. Stylized realism perfect for children's game. Cute but detailed. Professional 3D asset. High quality texture."

**Style:** Elegant, playful, detailed
**Export:** GLB format

---

### Unicorn - Magical and Majestic
**Prompt:**
"A beautiful mythical unicorn with a flowing rainbow mane and tail. Graceful body with sparkly iridescent horn catching light beautifully. Soft pastel coloring with magical aura. Majestic but cute. Stylized fantasy art style. High quality 3D model with magical particle effects ready material. Perfect for children's education game."

**Style:** Magical, whimsical, sparkling
**Export:** GLB format

---

### Dragon - Powerful and Friendly
**Prompt:**
"A cute but impressive young dragon with iridescent blue-purple scales. Large expressive eyes, small sharp horns, powerful wings with detailed membrane textures. Breathing effect visible. Fantasy style. Friendly personality despite fierce appearance. High-quality 3D game asset. Professional lighting and textures."

**Style:** Fantasy, powerful, iridescent
**Export:** GLB format

---

### Phoenix - Fiery and Majestic
**Prompt:**
"A spectacular phoenix bird with flaming feathers in vibrant reds, oranges, and golds. Glowing embers around the body. Spread wings showing incredible detail and fire effects. Majestic and powerful. Stylized realism. High quality 3D model perfect for children's game. Bright, proud expression."

**Style:** Fiery, majestic, glowing
**Export:** GLB format

---

### T-Rex - Mighty and Terrifying
**Prompt:**
"A magnificent T-Rex dinosaur with realistic brown-green scales, powerful muscular build, huge claws, small fierce arms, massive head with sharp teeth visible. Fearsome but not scary for children. Realistic prehistoric creature. High quality 3D paleontological model. Professional game asset quality. Dynamic powerful stance."

**Style:** Realistic prehistoric, powerful
**Export:** GLB format

---

### Triceratops - Strong and Defensive
**Prompt:**
"A mighty Triceratops with three impressive golden horns, large protective bony frill behind head, brown textured scales, muscular build, strong stance. Herbivore but impressive and commanding. Realistic prehistoric creature. High quality 3D model. Perfect for educational children's game."

**Style:** Realistic prehistoric, strong
**Export:** GLB format

---

### Stegosaurus - Unique and Gentle
**Prompt:**
"A friendly-looking Stegosaurus with distinctive row of large bony plates along its back, small head, brown body with lighter spotted patterns, powerful tail with spikes, gentle herbivore expression. Unique silhouette. Realistic but approachable. High quality 3D prehistoric model for children's game."

**Style:** Realistic prehistoric, unique
**Export:** GLB format

---

### Pterodactyl - Graceful and Aerial
**Prompt:**
"A magnificent Pterodactyl flying dinosaur with huge impressive wings spread wide, pointed head crest, small body, lightweight appearance, tan and brown coloring, predatory but elegant. Detailed wing membrane texture. Realistic prehistoric flying creature. High quality 3D game asset."

**Style:** Realistic prehistoric, aerial
**Export:** GLB format

---

## After Generation

1. Download each model as `.glb` file
2. Upload to a CDN (e.g., Cloudinary, CDN.js, or AWS S3)
3. Replace the URLs in `pet3DRenderer.ts` modelUrls map
4. Test each pet in the game

## Example URL Update
```typescript
private modelUrls: Record<PetType, string> = {
  dog: 'https://your-cdn.com/models/dog.glb',
  cat: 'https://your-cdn.com/models/cat.glb',
  // ... etc
};
```

---

## Alternative Services

If Tripo3D is busy/unavailable:
- **Meshy.ai** - Similar AI 3D generator
- **Sketchfab** - Search for existing high-quality models with CC licenses
- **CGTrader Free** - Some free realistic models
