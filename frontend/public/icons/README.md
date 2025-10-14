# PWA Icons Directory

This directory contains the Progressive Web App icons for ROI Systems.

## Required Icons

Generate the following icon sizes using your brand logo:

### Standard Icons (Any Purpose)
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px (Android standard)
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px (Android splash screen)

### Maskable Icons (Safe Area)
- `icon-192x192-maskable.png` - 192x192px with safe area
- `icon-512x512-maskable.png` - 512x512px with safe area

## Design Guidelines

### Brand Colors
- Primary: `#6366f1` (Indigo/Purple)
- Background: `#ffffff` (White)
- Text: `#1e293b` (Dark slate)

### Standard Icons
- Use your full logo with transparent or white background
- Ensure logo fills at least 80% of the icon area
- Export as PNG with transparency

### Maskable Icons
**IMPORTANT**: Maskable icons require a safe area to prevent clipping on different device shapes.

- Keep critical content within **80% of the icon area** (safe zone)
- Use a solid background color (recommended: `#6366f1`)
- Center your logo mark within the safe zone
- Test using: https://maskable.app/editor

### Example Structure
```
Standard Icon (192x192):
┌─────────────────────┐
│                     │
│   ┌───────────┐    │
│   │           │    │
│   │   LOGO    │    │
│   │           │    │
│   └───────────┘    │
│                     │
└─────────────────────┘

Maskable Icon (192x192):
┌─────────────────────┐
│  Background Color   │
│   ┌───────────┐    │
│   │  Safe     │    │ ← 80% safe zone
│   │  Zone     │    │
│   └───────────┘    │
│                     │
└─────────────────────┘
```

## Generation Methods

### Option 1: Online Tools
- **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Maskable Editor**: https://maskable.app/editor

### Option 2: Image Editing Software
1. Create a 512x512px canvas
2. Import your logo
3. Scale logo to fill 80-90% of canvas
4. Export at each required size
5. For maskable: add background color and center logo in safe zone

### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt-get install imagemagick  # Ubuntu/Debian

# Generate standard icons from source (logo.png)
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png

# Generate maskable icons with background
convert -size 192x192 xc:"#6366f1" \
  logo-safe.png -gravity center -composite \
  icon-192x192-maskable.png

convert -size 512x512 xc:"#6366f1" \
  logo-safe.png -gravity center -composite \
  icon-512x512-maskable.png
```

## Screenshots Directory

Create `/public/screenshots/` with:
- `dashboard-desktop.png` - 1280x720px desktop screenshot
- `documents-mobile.png` - 750x1334px mobile screenshot

These are shown in the PWA install prompt to preview the app.

## Testing

### Local Testing
1. Build the app: `npm run build`
2. Serve locally: `npm run preview`
3. Test on device: Use ngrok or similar to expose to mobile devices

### Validation Tools
- **Lighthouse PWA Audit**: Check PWA score in Chrome DevTools
- **PWA Builder**: https://www.pwabuilder.com/ - Validate manifest and icons
- **Chrome DevTools**: Application > Manifest - Verify icons load correctly
- **Maskable Test**: https://maskable.app/ - Test maskable icon appearance

### Checklist
- [ ] All standard icon sizes generated
- [ ] Both maskable icons created with safe area
- [ ] Icons display correctly in browser (check DevTools)
- [ ] Theme color matches manifest (#6366f1)
- [ ] Apple touch icon appears on iOS devices
- [ ] Install prompt shows correct icon
- [ ] Screenshots added for install preview
