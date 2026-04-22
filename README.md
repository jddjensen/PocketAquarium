# Pocket Aquarium

A pixel-art aquarium park sim — somewhere between Pokémon (creature collecting,
rarity tiers, sprite-driven charm) and RollerCoaster Tycoon (tile-based building,
guests paying tickets, growing your park).

## How it plays

1. **Build paths** from the entrance (highlighted tile bottom-left) into your park.
2. **Place tanks** on floor tiles — bigger tanks cost more but hold more fish.
3. **Open the FISH panel** (top-right) to stock a tank. Click a species, then click a tank.
4. **Guests walk the paths**, stop to admire tanks near the path, pay you tickets, and
   raise your park's reputation.
5. **Higher reputation unlocks rarer species** — legendary fish like the _Aurorakoi_
   only appear once your park is thriving.
6. Everything auto-saves to `localStorage` every 5 seconds and when the scene closes.

## Tech stack

- **[Phaser 3](https://phaser.io/)** — 2D game engine, pixel-art mode, scenes, input
- **[Vite](https://vitejs.dev/)** — dev server + bundler
- **TypeScript** (strict, `exactOptionalPropertyTypes`)
- **ESLint + Prettier** — lint and format
- **Vitest** — unit tests

## Art direction

- **Internal resolution**: 320×180, scaled up with integer-ratio nearest-neighbor
  (GBA-style). The Phaser canvas runs with `pixelArt: true` and `roundPixels: true`.
- **Palette**: a 16-ish color palette locked in [src/constants.ts](src/constants.ts)
  (`PALETTE`). Everything drawn — fish, decor, tanks, UI — must pull from this palette
  so the aesthetic stays coherent.
- **Sprites**: hand-authored pixel grids in
  [src/scenes/PreloadScene.ts](src/scenes/PreloadScene.ts), turned into textures
  via `Graphics.generateTexture()`. Replace any of these with real `.png` sprites
  at the same dimensions later — just swap the preload call.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR        |
| `npm run build`     | Type-check and build for production       |
| `npm run preview`   | Preview the production build locally      |
| `npm run typecheck` | Run the TypeScript compiler (no emit)     |
| `npm run lint`      | Run ESLint                                |
| `npm run format`    | Format `src/` with Prettier               |
| `npm test`          | Run the Vitest suite                      |

## Project structure

```
src/
├── main.ts                # Entry point
├── config.ts              # Phaser game config (pixel-art mode, scenes)
├── constants.ts           # Game size, tile size, PALETTE (Phaser-free)
├── style.css
├── data/
│   └── species.ts         # Fish species registry (stats, rarity, unlock tiers)
├── world/
│   └── Grid.ts            # Tile grid + world/tile coord conversions
├── systems/
│   └── GameState.ts       # Money, reputation, placements, save/load, current tool
├── entities/
│   ├── Fish.ts            # Fish wander inside a Tank's bounds
│   ├── Tank.ts            # A placed tank — holds fish, computes appeal
│   ├── Decor.ts           # Plants and rocks
│   └── Guest.ts           # NPC that pathfinds on path tiles, admires tanks
└── scenes/
    ├── BootScene.ts
    ├── PreloadScene.ts    # Generates all pixel-art textures
    ├── ParkScene.ts       # The park: renders tiles, handles build tool clicks
    └── UIScene.ts         # HUD, build palette, fish collection panel
```

### Scene split

Phaser runs multiple scenes in parallel. `UIScene` runs over `ParkScene` so HUD
elements aren't affected by the park's world coordinates and can be refreshed
independently. Same pattern fits future modals, menus, and shops.

### Save format

`localStorage` key `pocket-aquarium:save:v1` holds a versioned JSON blob
(money, reputation, placements, caught species). Bump the version and branch on
load if the schema changes.

## Deployment

[netlify.toml](netlify.toml) is ready to go — connect the GitHub repo to Netlify
and it'll auto-build `dist/`. For GitHub Pages or any static host, deploy the
contents of `dist/` after `npm run build`.

## Roadmap

- Water quality (tanks degrade without filters)
- Feeding mechanic (drop food, feed happiness)
- Day/night cycle tinting the palette
- Fish breeding / trait inheritance
- Staff (janitors, tank cleaners) — the RCT-style management loop
- Gacha/gashapon "rare catch" event for legendary fish
- Audio (chiptune BGM, pellet plop, coin ching)
