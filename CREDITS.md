# Credits

## Code

All original. Design techniques studied from:

- The GBA sprite/palette/OAM conventions that Gen 3 games used (3-tone shading,
  16-color per-object palettes, 2-frame animation cycles, 4-direction NPC
  textures with horizontal mirroring for `right`). Applied from general
  knowledge of the platform — no disassembly code or assets were copied.

## Art

Procedural fallbacks in [src/scenes/PreloadScene.ts](src/scenes/PreloadScene.ts).

AI-generated sprites (via [PixelLab](https://pixellab.ai/) — paid subscription,
user's own account, generations owned by the user per PixelLab's terms of service):

- **Grass-on-dirt iso tile** — seed 1001, 32×32 thick iso tile. Overrides `tile-grass`.
- **Stylized park tree** — 48×64 map object, low top-down view. Overrides `decor-tree`.
- **Wooden park bench** — 48×32 map object, low top-down view. Overrides `decor-bench`.
- **Clustered flowerbed** — 32×32 map object, low top-down view. Overrides `decor-flowerbed`.
- **Stone park fountain** — 48×56 map object, low top-down view. Overrides `decor-fountain`.
- **Park guest character (ParkGuest)** — 24×24, humanoid chibi, 4 directions,
  `walking-4-frames` template animation. Frame 0 and frame 2 of each direction
  wired to `guest-{down,up,left,right}-{0,1}`.

When you drop in external sprite packs via [public/assets/manifest.json](public/assets/manifest.json),
add an entry here with the pack name, author, and license.

Template:

```
- **<pack name>** by <author> — <license> — <url>
  Used for: <which textures>
```

## Engine & libraries

- **[Phaser 3](https://phaser.io/)** — MIT
- **[Vite](https://vitejs.dev/)** — MIT
- **TypeScript**, **ESLint**, **Prettier**, **Vitest** — MIT / BSD

## Explicitly NOT used

- No Nintendo, Game Freak, or Pokémon Company assets.
- No pret/pokeemerald code or assets.
