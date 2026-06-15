#!/bin/bash
# Tripo3D Model Manager
# This script helps you manage and test model URLs

# STEP 1: Set your Cloudinary account credentials
# Get from: https://cloudinary.com/console/settings/credentials

CLOUDINARY_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# STEP 2: After generating models on Tripo3D, download them to a folder
# Example folder: ./downloaded-models/

# STEP 3: Upload to Cloudinary using curl
upload_to_cloudinary() {
  local file=$1
  local name=$(basename "$file" .glb)
  
  curl -X POST \
    -F "file=@$file" \
    -F "resource_type=raw" \
    -F "public_id=pets/$name" \
    "https://api.cloudinary.com/v1_1/$CLOUDINARY_NAME/raw/upload" \
    -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET"
}

# STEP 4: Generate URLs
# Format: https://res.cloudinary.com/[CLOUDINARY_NAME]/raw/upload/v1/pets/[filename].glb

# EXAMPLE URL MAPPING
cat > src/pet3DModels.config.ts << 'EOF'
import type { PetType } from './types';

// Update these URLs after uploading to Cloudinary
export const MODEL_URLS: Record<PetType, string> = {
  dog: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/dog.glb',
  cat: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/cat.glb',
  unicorn: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/unicorn.glb',
  dragon: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/dragon.glb',
  phoenix: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/phoenix.glb',
  trex: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/trex.glb',
  triceratops: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/triceratops.glb',
  stegosaurus: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/stegosaurus.glb',
  pterodactyl: 'https://res.cloudinary.com/YOUR_NAME/raw/upload/v1/pets/pterodactyl.glb',
};
EOF

echo "Config file created! Update the URLs with your Cloudinary account name."
echo ""
echo "To upload a single file:"
echo "  upload_to_cloudinary downloaded-models/dog.glb"
echo ""
echo "To upload all files:"
echo "  for file in downloaded-models/*.glb; do upload_to_cloudinary \"$file\"; done"
