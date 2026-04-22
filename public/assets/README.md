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
