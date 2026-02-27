# Icon Assets

This directory holds the icon and image assets required by Electron Builder to produce platform-specific installers.

## Required Files

| File | Platform | Spec |
|---|---|---|
| `icon.icns` | macOS | ICNS format, 1024×1024 minimum |
| `icon.ico` | Windows | ICO format, 256×256 with embedded 16/32/48/64/128/256 sizes |
| `icon.png` | Linux | PNG, 512×512 |
| `dmg-background.png` | macOS DMG | PNG, 540×380 |

## Generating Icons from a Source PNG

Start with a single high-resolution source image (1024×1024 or larger, PNG with transparency).

### Option A — electron-icon-maker (all platforms)

```bash
npx electron-icon-maker --input=source-1024.png --output=./
```

This produces `icons/mac/icon.icns`, `icons/win/icon.ico`, and `icons/png/*.png`. Copy the relevant files into this directory.

### Option B — macOS iconutil (ICNS only)

```bash
mkdir icon.iconset
for size in 16 32 64 128 256 512 1024; do
  sips -z $size $size source-1024.png --out icon.iconset/icon_${size}x${size}.png
done
# Retina variants
for size in 16 32 64 128 256 512; do
  doubled=$((size * 2))
  cp icon.iconset/icon_${doubled}x${doubled}.png icon.iconset/icon_${size}x${size}@2x.png
done
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

### Option C — ImageMagick (ICO)

```bash
convert source-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## DMG Background

The DMG background image should be exactly 540×380 pixels. It appears behind the app icon and Applications folder link in the macOS disk image window. Use a subtle branded background; avoid placing text where the icons will sit (around x=130 and x=410, y=220).
