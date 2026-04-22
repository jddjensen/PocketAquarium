# Assets

Drop CC0 / permissively-licensed pixel-art here to override the procedural
sprites. List each override in `manifest.json` — it is fetched at boot and any
listed texture key replaces the procedural one.

## How override works

1. Place your image in this folder (e.g. `public/assets/sprites/my-goldie.png`).
2. Add it to `manifest.json`:

```json
{
  "textures": {
    "fish-goldie-a": "sprites/my-goldie.png",
    "fish-goldie-b": "sprites/my-goldie-frame2.png"
  }
}
```

3. Restart the dev server (Vite picks it up on next preload).

## Texture keys

See [src/scenes/PreloadScene.ts](../../src/scenes/PreloadScene.ts) for the full
list. Key categories:

- `fish-<speciesId>-a` / `fish-<speciesId>-b` — two swim frames per species
- `decor-plant`, `decor-rock`
- `guest-down-0`, `guest-down-1`, `guest-up-0`, `guest-up-1`, `guest-left-0`, `guest-left-1`
  (engine mirrors `left` horizontally for `right` to save textures)
- `tile-path`, `tile-floor`
- `tank-<w>x<h>-a` / `tank-<w>x<h>-b` — two ripple frames per tank size (2x2, 3x2, 4x2, 3x3, 4x3)

## Dimensions

Procedural sprites are small — match these or the scale/pixel-art feel will break:

| Texture       | W × H (px)          |
| ------------- | ------------------- |
| small fish    | 10 × 5              |
| medium fish   | 12 × 6              |
| large fish    | 14 × 7              |
| plant / rock  | 16 × 16             |
| guest         | 8 × 10              |
| tile          | 16 × 16             |
| tank NxM      | 16*N × 16*M         |

## Suggested CC0 sources

- **Kenney** — <https://kenney.nl/assets> (filter: "2D", "pixel")
- **OpenGameArt** — <https://opengameart.org/> (filter by CC0)
- **itch.io** — <https://itch.io/game-assets/free/tag-pixel-art>

Always add attribution to `/CREDITS.md` even for CC0 (best practice).

## Making your own sprites with LibreSprite

[LibreSprite](https://libresprite.github.io/) is the recommended editor — free,
open-source (GPLv2), and its spritesheet export is supported natively.

### Workflow for a multi-frame fish

1. In LibreSprite: **File → New**, size `10×5` (small), `12×6` (medium), or
   `14×7` (large). Match the dimensions table above exactly.
2. Paint frame A on frame 1. Add frame 2 (**Frame → New Frame**) and paint
   frame B (tail offset by 1px for the swim wiggle).
3. **File → Export Sprite Sheet**.
   - Sheet type: **By rows** (or Packed — either works).
   - Output File: `public/assets/sprites/goldie-sheet.png`.
   - JSON Data: enable, **Hash** format, same folder.
4. Add to `manifest.json`:

```json
{
  "sheets": {
    "goldie": {
      "image": "sprites/goldie-sheet.png",
      "json": "sprites/goldie-sheet.json",
      "frames": {
        "fish-goldie-a": "goldie-sheet 0.aseprite",
        "fish-goldie-b": "goldie-sheet 1.aseprite"
      }
    }
  }
}
```

The frame names on the right must match the keys LibreSprite writes into the
JSON (`"filename"` field per frame). Open the JSON to confirm.

For one-off sprites (single frame, no animation), skip the sheet and use a
plain `"textures"` entry — it's lighter weight.
