import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  ISO_TILE_H,
  ISO_TILE_W,
  ISO_WALL_HEIGHT,
  PALETTE,
} from '../constants';
import { ALL_SPECIES, type SpeciesPalette } from '../data/species';

type PixelGrid = (number | null)[][];

/**
 * Optional external asset manifest. If [public/assets/manifest.json] exists,
 * any texture key it lists replaces the procedural version. Use this to drop in
 * CC0 packs (Kenney, OpenGameArt) or LibreSprite exports without touching code.
 *
 * Shape:
 *   {
 *     "textures": { "fish-goldie-a": "sprites/goldie.png", ... },
 *     "sheets": {
 *       "goldie": {
 *         "image": "sprites/goldie.png",
 *         "json":  "sprites/goldie.json",
 *         "frames": { "fish-goldie-a": "goldie 0.aseprite", "fish-goldie-b": "goldie 1.aseprite" }
 *       }
 *     }
 *   }
 *
 * `sheets` loads a LibreSprite/Aseprite-exported spritesheet (PNG + JSON hash)
 * as a Phaser atlas, then aliases each atlas frame to an engine texture key.
 */
interface AssetSheet {
  image: string;
  json: string;
  frames: Record<string, string>;
}
interface AssetManifest {
  textures?: Record<string, string>;
  sheets?: Record<string, AssetSheet>;
}

export class PreloadScene extends Phaser.Scene {
  private manifest: AssetManifest | null = null;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.drawLoadingBar();
    this.load.json('manifest', 'assets/manifest.json');
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'manifest') {
        // No manifest present — procedural textures will be used for everything.
      }
    });
  }

  create(): void {
    this.manifest = (this.cache.json.get('manifest') as AssetManifest) ?? null;
    this.generatePixelTextures();
    this.loadManifestOverrides(() => {
      this.scene.start('ParkScene');
      this.scene.launch('UIScene');
    });
  }

  private loadManifestOverrides(done: () => void): void {
    const overrides = this.manifest?.textures ?? {};
    const sheets = this.manifest?.sheets ?? {};
    const textureEntries = Object.entries(overrides);
    const sheetEntries = Object.entries(sheets);
    if (textureEntries.length === 0 && sheetEntries.length === 0) {
      done();
      return;
    }
    for (const [key, path] of textureEntries) {
      this.textures.remove(key);
      this.load.image(key, `assets/${path}`);
    }
    for (const [id, sheet] of sheetEntries) {
      this.load.atlas(`__sheet_${id}`, `assets/${sheet.image}`, `assets/${sheet.json}`);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.aliasSheetFrames(sheetEntries);
      done();
    });
    this.load.start();
  }

  private aliasSheetFrames(sheetEntries: [string, AssetSheet][]): void {
    for (const [id, sheet] of sheetEntries) {
      const atlasKey = `__sheet_${id}`;
      const atlas = this.textures.get(atlasKey);
      if (!atlas) continue;
      for (const [textureKey, frameName] of Object.entries(sheet.frames)) {
        const frame = atlas.has(frameName) ? atlas.get(frameName) : undefined;
        if (!frame) {
          console.warn(`[assets] sheet "${id}" has no frame "${frameName}"`);
          continue;
        }
        this.textures.remove(textureKey);
        const canvas = this.textures.createCanvas(textureKey, frame.width, frame.height);
        if (!canvas) continue;
        canvas.drawFrame(atlasKey, frameName, 0, 0);
        canvas.refresh();
      }
    }
  }

  private drawLoadingBar(): void {
    const width = 120;
    const height = 4;
    const x = (GAME_WIDTH - width) / 2;
    const y = GAME_HEIGHT / 2;
    const bg = this.add.rectangle(x, y, width, height, PALETTE.waterDeep).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x, y, 0, height, PALETTE.waterSurface).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => (bar.width = width * v));
    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });
  }

  private generatePixelTextures(): void {
    for (const species of ALL_SPECIES) {
      this.drawGrid(`fish-${species.id}-a`, this.fishGrid(species.palette, species.size, 'a'));
      this.drawGrid(`fish-${species.id}-b`, this.fishGrid(species.palette, species.size, 'b'));
    }
    this.drawGrid('decor-plant', this.plantGrid());
    this.drawGrid('decor-rock', this.rockGrid());

    for (const dir of ['down', 'up', 'left'] as const) {
      this.drawGrid(`guest-${dir}-0`, this.guestGrid(dir, 0));
      this.drawGrid(`guest-${dir}-1`, this.guestGrid(dir, 1));
    }

    this.drawGrid('tile-path', this.isoDiamondTile(PALETTE.path, PALETTE.sandShadow, 0xfcd97b));
    this.drawGrid('tile-floor', this.isoDiamondTile(PALETTE.floor, PALETTE.sandShadow, null));
    this.drawGrid(
      'tile-grass',
      this.isoDiamondTile(PALETTE.grass, PALETTE.grassShade, PALETTE.grassHighlight),
    );
    this.drawGrid('tile-wall', this.isoWallTile());
    this.drawGrid('tile-door', this.isoDoorTile());

    const tankSizes: [number, number][] = [
      [2, 2],
      [3, 2],
      [4, 2],
      [3, 3],
      [4, 3],
    ];
    for (const [w, h] of tankSizes) {
      this.drawGrid(`tank-${w}x${h}-a`, this.isoTankGrid(w, h, 0));
      this.drawGrid(`tank-${w}x${h}-b`, this.isoTankGrid(w, h, 1));
    }
  }

  private drawGrid(key: string, grid: PixelGrid): void {
    const h = grid.length;
    const w = grid[0]?.length ?? 0;
    if (w === 0 || h === 0) return;
    const g = this.add.graphics();
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < w; x++) {
        const color = row[x];
        if (color == null) continue;
        g.fillStyle(color, 1);
        g.fillRect(x, y, 1, 1);
      }
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /**
   * Fish sprite with 3-tone shading (shadow/base/highlight) and a second frame
   * where the tail is offset by one pixel — creates a swim wiggle when alternated.
   */
  private fishGrid(
    pal: SpeciesPalette,
    size: 'small' | 'medium' | 'large',
    frame: 'a' | 'b',
  ): PixelGrid {
    const _ = null;
    const S = pal.shadow;
    const B = pal.base;
    const H = pal.highlight;
    const F = pal.fin;
    const E = pal.eye;
    const tailDown = frame === 'a';

    if (size === 'small') {
      return tailDown
        ? [
            [_, _, _, _, B, B, B, _, _, _],
            [_, _, B, B, H, H, B, B, _, _],
            [F, F, B, H, H, B, B, E, B, _],
            [F, F, B, S, S, B, B, B, _, _],
            [_, _, _, _, S, S, _, _, _, _],
          ]
        : [
            [_, _, _, _, S, S, _, _, _, _],
            [_, _, B, B, H, H, B, B, _, _],
            [F, F, B, H, H, B, B, E, B, _],
            [F, F, B, S, S, B, B, B, _, _],
            [_, _, _, _, B, B, B, _, _, _],
          ];
    }

    if (size === 'medium') {
      return tailDown
        ? [
            [_, _, _, _, _, B, B, B, B, _, _, _],
            [_, _, _, B, B, H, H, H, B, B, _, _],
            [_, F, B, B, H, H, H, B, B, E, B, _],
            [F, F, B, B, S, S, B, B, B, B, B, _],
            [_, F, _, _, S, S, S, _, _, _, _, _],
            [_, _, _, _, _, S, _, _, _, _, _, _],
          ]
        : [
            [_, _, _, _, _, S, _, _, _, _, _, _],
            [_, F, _, _, S, S, S, _, _, _, _, _],
            [_, F, B, B, H, H, H, B, B, E, B, _],
            [F, F, B, B, H, H, B, B, B, B, B, _],
            [_, _, _, B, B, S, H, H, B, B, _, _],
            [_, _, _, _, _, B, B, B, B, _, _, _],
          ];
    }

    return tailDown
      ? [
          [_, _, _, _, _, _, B, B, B, B, B, _, _, _],
          [_, _, _, _, B, B, H, H, H, H, B, B, _, _],
          [_, _, F, B, B, H, H, H, H, B, B, B, B, _],
          [_, F, F, B, H, H, H, H, B, B, B, E, B, B],
          [F, F, F, B, B, S, S, B, B, B, B, B, B, _],
          [_, F, F, _, S, S, S, S, _, _, _, _, _, _],
          [_, _, _, _, _, S, S, _, _, _, _, _, _, _],
        ]
      : [
          [_, _, _, _, _, S, S, _, _, _, _, _, _, _],
          [_, F, F, _, S, S, S, S, _, _, _, _, _, _],
          [_, F, F, B, B, H, H, H, B, B, B, B, B, _],
          [F, F, F, B, H, H, H, H, B, B, B, E, B, B],
          [_, F, F, B, B, S, H, H, H, B, B, B, B, _],
          [_, _, _, _, B, B, H, H, H, H, B, B, _, _],
          [_, _, _, _, _, _, B, B, B, B, B, _, _, _],
        ];
  }

  private plantGrid(): PixelGrid {
    const _ = null;
    const h = PALETTE.plant;
    const d = PALETTE.plantShadow;
    const hl = 0x5fe060;
    return [
      [_, _, _, h, _, _, h, _, _, _, _, _, _, _, _, _],
      [_, _, h, h, h, _, h, h, _, _, _, h, _, _, _, _],
      [_, _, h, hl, h, h, h, h, h, _, _, h, h, _, _, _],
      [_, h, h, hl, hl, h, h, h, h, h, h, h, h, _, _, _],
      [_, h, h, hl, h, d, d, d, h, h, d, d, h, _, _, _],
      [_, h, h, h, d, d, d, d, d, d, d, h, h, _, _, _],
      [_, _, h, h, d, d, d, d, d, d, h, h, _, _, _, _],
      [_, _, _, h, h, d, d, d, d, h, h, _, _, _, _, _],
      [_, _, _, _, h, h, d, d, h, h, _, _, _, _, _, _],
      [_, _, _, _, _, h, h, h, h, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, h, h, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, h, h, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, d, h, h, d, _, _, _, _, _, _, _],
      [_, _, _, _, d, d, d, d, d, d, _, _, _, _, _, _],
      [_, _, _, d, d, d, d, d, d, d, d, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  private rockGrid(): PixelGrid {
    const _ = null;
    const hl = 0x7e8ea8;
    const m = PALETTE.stone;
    const s = PALETTE.stoneShadow;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, m, m, m, m, _, _, _, _, _, _, _],
      [_, _, _, _, m, hl, hl, m, m, m, _, _, _, _, _, _],
      [_, _, _, m, hl, hl, hl, m, m, m, m, _, _, _, _, _],
      [_, _, m, m, hl, hl, m, m, m, m, m, m, _, _, _, _],
      [_, m, hl, m, m, m, m, m, m, m, m, m, m, _, _, _],
      [_, m, m, m, m, m, m, s, s, m, m, m, m, _, _, _],
      [m, m, m, m, m, s, s, s, s, s, m, m, m, m, _, _],
      [m, m, m, s, s, s, s, s, s, s, s, m, m, m, _, _],
      [m, m, s, s, s, s, s, s, s, s, s, s, m, m, _, _],
      [m, s, s, s, s, s, s, s, s, s, s, s, s, m, _, _],
      [s, s, s, s, s, s, s, s, s, s, s, s, s, s, _, _],
      [s, s, s, s, s, s, s, s, s, s, s, s, s, s, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  /**
   * Gen 3-style NPC: 3 directions, 2-frame walk cycle. Left is mirrored at draw
   * time for "right" — saves a texture. Foot offset creates the bob.
   */
  private guestGrid(dir: 'down' | 'up' | 'left', frame: 0 | 1): PixelGrid {
    const _ = null;
    const skin = PALETTE.guestSkin;
    const skinShade = 0xd38b4a;
    const shirt = PALETTE.fishRed;
    const shirtShade = 0xb13e53;
    const hair = PALETTE.stoneShadow;
    const pants = PALETTE.waterDeep;
    const eye = 0x000000;

    const footL = frame === 0 ? pants : _;
    const footR = frame === 0 ? _ : pants;
    const footLe = frame === 0 ? _ : pants;
    const footRe = frame === 0 ? pants : _;

    if (dir === 'down') {
      return [
        [_, _, hair, hair, hair, hair, _, _],
        [_, hair, hair, hair, hair, hair, hair, _],
        [_, hair, skin, skinShade, skin, hair, _, _],
        [_, hair, skin, eye, skin, eye, skin, _],
        [_, _, skin, skin, skinShade, skin, _, _],
        [_, shirt, shirtShade, shirt, shirt, shirt, shirt, _],
        [_, shirt, shirt, shirt, shirtShade, shirt, shirt, _],
        [_, shirt, shirt, _, _, shirt, shirt, _],
        [_, pants, pants, _, _, pants, pants, _],
        [_, footL, pants, _, _, pants, footR, _],
      ];
    }
    if (dir === 'up') {
      return [
        [_, _, hair, hair, hair, hair, _, _],
        [_, hair, hair, hair, hair, hair, hair, _],
        [_, hair, hair, hair, hair, hair, hair, _],
        [_, hair, hair, hair, hair, hair, hair, _],
        [_, _, skin, skin, skin, skin, _, _],
        [_, shirt, shirt, shirtShade, shirt, shirt, shirt, _],
        [_, shirt, shirt, shirt, shirt, shirt, shirt, _],
        [_, shirt, shirt, _, _, shirt, shirt, _],
        [_, pants, pants, _, _, pants, pants, _],
        [_, footL, pants, _, _, pants, footR, _],
      ];
    }
    return [
      [_, _, hair, hair, hair, _, _, _],
      [_, hair, hair, hair, hair, hair, _, _],
      [_, hair, skin, skin, hair, hair, _, _],
      [_, hair, eye, skin, skin, hair, _, _],
      [_, _, skin, skin, skin, skin, _, _],
      [_, shirt, shirt, shirtShade, shirt, shirt, _, _],
      [_, shirt, shirt, shirt, shirt, shirt, _, _],
      [_, shirt, shirt, _, shirt, shirt, _, _],
      [_, pants, pants, _, pants, pants, _, _],
      [_, footLe, pants, _, pants, footRe, _, _],
    ];
  }

  /**
   * Returns the pixel mask for a single iso diamond tile (ISO_TILE_W × ISO_TILE_H).
   * `true` cells are inside the rhombus. Used by tile/pool generators to limit
   * drawing to the diamond footprint.
   */
  private isoDiamondMask(): boolean[][] {
    const w = ISO_TILE_W;
    const h = ISO_TILE_H;
    const cx = w / 2;
    const cy = h / 2;
    const mask: boolean[][] = [];
    for (let y = 0; y < h; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x + 0.5 - cx) / cx;
        const dy = Math.abs(y + 0.5 - cy) / cy;
        row.push(dx + dy <= 1);
      }
      mask.push(row);
    }
    return mask;
  }

  /**
   * Diamond floor tile. `base` fills the interior, `edge` outlines the rhombus,
   * optional `hi` speckle adds texture.
   */
  private isoDiamondTile(base: number, edge: number, hi: number | null): PixelGrid {
    const mask = this.isoDiamondMask();
    const w = ISO_TILE_W;
    const h = ISO_TILE_H;
    const grid: PixelGrid = [];
    for (let y = 0; y < h; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < w; x++) {
        if (!mask[y]![x]) {
          row.push(null);
          continue;
        }
        const onEdge =
          !mask[y]![x - 1] ||
          !mask[y]![x + 1] ||
          !(mask[y - 1]?.[x] ?? false) ||
          !(mask[y + 1]?.[x] ?? false);
        if (onEdge) {
          row.push(edge);
          continue;
        }
        const speckle = hi != null && (x * 3 + y * 7) % 11 === 0;
        row.push(speckle ? hi : base);
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Tall wall sprite: iso-diamond top cap at the bottom, brick face rising above.
   * Sprite dims: ISO_TILE_W × (ISO_TILE_H + ISO_WALL_HEIGHT). Intended to be
   * drawn with origin (0.5, 1) at the tile center offset down by TILE_H/2 so the
   * diamond base aligns with the floor it sits on.
   */
  private isoWallTile(): PixelGrid {
    const w = ISO_TILE_W;
    const totalH = ISO_TILE_H + ISO_WALL_HEIGHT;
    const mask = this.isoDiamondMask();
    const base = PALETTE.brick;
    const shade = PALETTE.brickShade;
    const hi = PALETTE.brickHighlight;
    const capLight = PALETTE.stone;
    const capDark = PALETTE.stoneShadow;
    const grid: PixelGrid = [];
    for (let y = 0; y < totalH; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < w; x++) {
        if (y >= ISO_WALL_HEIGHT) {
          // Bottom cap — iso diamond top of the wall block.
          const my = y - ISO_WALL_HEIGHT;
          if (!mask[my]![x]) {
            row.push(null);
            continue;
          }
          const onEdge =
            !mask[my]![x - 1] ||
            !mask[my]![x + 1] ||
            !(mask[my - 1]?.[x] ?? false) ||
            !(mask[my + 1]?.[x] ?? false);
          row.push(onEdge ? capDark : capLight);
          continue;
        }
        // Face — full column; the diamond cap below hides the rectangular overhang.
        const brickRow = Math.floor(y / 4);
        const offset = brickRow % 2 === 0 ? 0 : 4;
        const mortarX = (x + offset) % 8 === 0;
        const mortarY = y % 4 === 0;
        const topEdge = y === 0;
        const leftEdge = x === 0;
        const rightEdge = x === w - 1;
        if (topEdge || leftEdge) row.push(hi);
        else if (rightEdge) row.push(shade);
        else if (mortarX || mortarY) row.push(shade);
        else row.push(base);
      }
      grid.push(row);
    }
    return grid;
  }

  /** Door uses the wall silhouette with a wooden panel + handle on the face. */
  private isoDoorTile(): PixelGrid {
    const grid = this.isoWallTile();
    const wood = PALETTE.doorWood;
    const dark = PALETTE.doorWoodShade;
    const light = PALETTE.doorWoodHighlight;
    const handle = PALETTE.doorHandle;
    const w = ISO_TILE_W;
    const doorLeft = 3;
    const doorRight = w - 4;
    for (let y = 2; y < ISO_WALL_HEIGHT - 1; y++) {
      for (let x = doorLeft; x <= doorRight; x++) {
        const onDoorEdge = x === doorLeft || x === doorRight || y === 2;
        const plankSeam = x === Math.floor(w / 2);
        grid[y]![x] = onDoorEdge ? light : plankSeam ? dark : wood;
      }
    }
    // handle
    if (grid[ISO_WALL_HEIGHT - 6]) {
      grid[ISO_WALL_HEIGHT - 6]![doorRight - 1] = handle;
    }
    return grid;
  }

  /**
   * Iso fenced habitat for an N×M tile footprint:
   *   - Wooden fence perimeter (dark posts + lighter rail highlight)
   *   - Inner grass margin so the water reads as a contained pond, not a tile
   *   - Water pool interior with ripple sparkle (frame 0/1 shifts the highlights)
   * Read from outside-in: outer fence → grass rim → water body.
   */
  private isoTankGrid(cols: number, rows: number, frame: 0 | 1): PixelGrid {
    const w = (cols + rows) * (ISO_TILE_W / 2);
    const h = (cols + rows) * (ISO_TILE_H / 2);
    const water = PALETTE.waterMid;
    const waterDeep = PALETTE.waterDeep;
    const waterLight = PALETTE.waterLight;
    const surface = PALETTE.waterSurface;
    const surfaceHi = 0xbfe7ff;
    const fencePost = PALETTE.doorWoodShade;
    const fenceRail = PALETTE.doorWood;
    const fenceRailHi = PALETTE.doorWoodHighlight;
    const grassRim = PALETTE.grass;
    const grassRimShade = PALETTE.grassShade;
    const grid: PixelGrid = [];
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x + 0.5 - cx) / cx;
        const dy = Math.abs(y + 0.5 - cy) / cy;
        const sum = dx + dy;
        if (sum > 1) {
          row.push(null);
          continue;
        }
        // Outermost band: wooden fence. Back edges (upper half of rhombus) get
        // the lit rail tone; front edges darker so the eye reads "behind" vs
        // "in front of" the pool.
        if (sum > 0.92) {
          const back = y < cy;
          // Periodic fence posts — small dark stems along the rail.
          const along = x + y;
          const postTick = along % 6 === 0;
          if (postTick) {
            row.push(fencePost);
            continue;
          }
          row.push(back ? fenceRailHi : fenceRail);
          continue;
        }
        // Grass rim — thin margin between fence and water.
        if (sum > 0.82) {
          const speckle = (x * 3 + y * 7) % 11 === 0;
          row.push(speckle ? grassRimShade : grassRim);
          continue;
        }
        // Water interior: depth from top→bottom, ripple sparkle near the back.
        const nearTop = y < cy - cy * 0.4;
        if (nearTop) {
          const rippleOffset = frame === 0 ? 0 : 1;
          const isHi = (x + rippleOffset) % 5 === 0;
          row.push(isHi ? surfaceHi : surface);
          continue;
        }
        const depth = y / h;
        const tone = depth > 0.75 ? waterDeep : depth < 0.45 ? waterLight : water;
        row.push((x * 5 + y * 3) % 29 === 0 ? waterLight : tone);
      }
      grid.push(row);
    }
    return grid;
  }
}
