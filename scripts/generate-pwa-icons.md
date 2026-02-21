# PWA Icons Generation Guide

## Required Icons

The manifest.json requires these icon sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (maskable)
- 384x384
- 512x512

## Quick Solution

### Option 1: Use Online Tool
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 logo
3. Download all sizes
4. Place in `/public/icons/`

### Option 2: Use ImageMagick (if installed)
```bash
# Create icons directory
mkdir -p public/icons

# Generate icons from a 512x512 source image
convert source-icon.png -resize 72x72 public/icons/icon-72.png
convert source-icon.png -resize 96x96 public/icons/icon-96.png
convert source-icon.png -resize 128x128 public/icons/icon-128.png
convert source-icon.png -resize 144x144 public/icons/icon-144.png
convert source-icon.png -resize 152x152 public/icons/icon-152.png
convert source-icon.png -resize 192x192 public/icons/icon-192.png
convert source-icon.png -resize 384x384 public/icons/icon-384.png
cp source-icon.png public/icons/icon-512.png
```

### Option 3: Temporary Placeholder
Create a simple placeholder icon until you have the real one.
