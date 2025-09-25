# Showcase Assets

This folder contains images specifically used for the dynamic volume cover showcase on the landing page.

## Current Assets

### Volume 37
- `Usogui_Volume_37_background.png` - Main volume cover background
- `Usogui_Volume_37_popout.png` - Character popout overlay

### Volume 38
- `Usogui_Volume_38_background.png` - Main volume cover background
- `Usogui_Volume_38_popout.png` - Character popout overlay

## Usage

These images are referenced in the showcase configuration system at `src/lib/showcase-config.ts` and used by the `DynamicVolumeShowcase` component.

## Adding New Showcase Images

1. Add background and popout images to this folder
2. Update the configuration in `src/lib/showcase-config.ts`
3. Test using the demo page at `/showcase-demo`

## Image Requirements

- **Background**: Full volume cover image (recommended: ~300-400px width)
- **Popout**: Character or element to float over background (transparent PNG recommended)
- **Format**: PNG preferred for quality and transparency support
- **Naming**: Use consistent naming pattern: `Usogui_Volume_[NUMBER]_[TYPE].png`