import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, TILE_SIZE } from '../constants';
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

    this.drawGrid('tile-path', this.pathTileGrid());
    this.drawGrid('tile-floor', this.floorTileGrid());
    this.drawGrid('tile-grass', this.grassTileGrid());
    this.drawGrid('tile-wall', this.wallTileGrid());
    this.drawGrid('tile-door', this.doorTileGrid());

    const tankSizes: [number, number][] = [
      [2, 2],
      [3, 2],
      [4, 2],
      [3, 3],
      [4, 3],
    ];
    for (const [w, h] of tankSizes) {
      this.drawGrid(`tank-${w}x${h}-a`, this.tankGrid(w, h, 0));
      this.drawGrid(`tank-${w}x${h}-b`, this.tankGrid(w, h, 1));
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

  private pathTileGrid(): PixelGrid {
    const base = PALETTE.path;
    const dark = PALETTE.sandShadow;
    const light = 0xfcd97b;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        const edge = x === 0 || y === 0 || x === TILE_SIZE - 1 || y === TILE_SIZE - 1;
        const hashLight = (x + y) % 6 === 0;
        const hashDark = (x * 3 + y * 5) % 19 === 0;
        row.push(edge ? dark : hashDark ? dark : hashLight ? light : base);
      }
      grid.push(row);
    }
    return grid;
  }

  private floorTileGrid(): PixelGrid {
    const base = PALETTE.floor;
    const dark = PALETTE.sandShadow;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        const speck = (x * 7 + y * 11) % 23 === 0;
        row.push(speck ? dark : base);
      }
      grid.push(row);
    }
    return grid;
  }

  private grassTileGrid(): PixelGrid {
    const base = PALETTE.grass;
    const shade = PALETTE.grassShade;
    const hi = PALETTE.grassHighlight;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        const blade = (x * 3 + y * 7) % 11 === 0;
        const dark = (x * 5 + y * 2) % 17 === 0;
        row.push(blade ? hi : dark ? shade : base);
      }
      grid.push(row);
    }
    return grid;
  }

  /** Stone brick wall with light edge on top/left, shadow on bottom/right. */
  private wallTileGrid(): PixelGrid {
    const base = PALETTE.brick;
    const shade = PALETTE.brickShade;
    const hi = PALETTE.brickHighlight;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        const topEdge = y === 0;
        const leftEdge = x === 0;
        const bottomEdge = y === TILE_SIZE - 1;
        const rightEdge = x === TILE_SIZE - 1;
        const brickRow = Math.floor(y / 4);
        const offset = brickRow % 2 === 0 ? 0 : 4;
        const mortarX = (x + offset) % 8 === 0;
        const mortarY = y % 4 === 0;

        if (topEdge || leftEdge) row.push(hi);
        else if (bottomEdge || rightEdge) row.push(shade);
        else if (mortarX || mortarY) row.push(shade);
        else row.push(base);
      }
      grid.push(row);
    }
    return grid;
  }

  /** Wooden door with a brass handle. */
  private doorTileGrid(): PixelGrid {
    const wood = PALETTE.doorWood;
    const dark = PALETTE.doorWoodShade;
    const light = PALETTE.doorWoodHighlight;
    const handle = PALETTE.doorHandle;
    const frame = PALETTE.brickShade;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        if (x === 0 || x === TILE_SIZE - 1 || y === 0) {
          row.push(frame);
          continue;
        }
        if (x === 1 || x === TILE_SIZE - 2 || y === 1) {
          row.push(light);
          continue;
        }
        const plankSeam = x === 5 || x === 10;
        const grain = (x + y * 2) % 7 === 0;
        if (x === TILE_SIZE - 4 && y === 8) {
          row.push(handle);
          continue;
        }
        row.push(plankSeam ? dark : grain ? dark : wood);
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Tank frame with glass highlights in the corners, animated water surface
   * ripples (frame 0 vs frame 1), and a subtle ambient water gradient.
   */
  private tankGrid(cols: number, rows: number, frame: 0 | 1): PixelGrid {
    const w = cols * TILE_SIZE;
    const h = rows * TILE_SIZE;
    const water = PALETTE.waterMid;
    const waterDeep = PALETTE.waterDeep;
    const waterLight = PALETTE.waterLight;
    const surface = PALETTE.waterSurface;
    const surfaceHi = 0xa8f4fb;
    const frame1 = PALETTE.stoneShadow;
    const frame2 = PALETTE.stone;
    const frame3 = 0x8aa0bf;
    const grid: PixelGrid = [];
    for (let y = 0; y < h; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < w; x++) {
        const onOuter = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        const onInner = x === 1 || y === 1 || x === w - 2 || y === h - 2;
        if (onOuter) {
          row.push(frame1);
          continue;
        }
        if (onInner) {
          const lit = (x <= 2 && y <= 4) || (y <= 2 && x <= 4);
          row.push(lit ? frame3 : frame2);
          continue;
        }
        if (y <= 3) {
          const rippleOffset = frame === 0 ? 0 : 1;
          const isHi = (x + rippleOffset) % 5 === 0;
          row.push(isHi ? surfaceHi : surface);
          continue;
        }
        const depth = y / h;
        const tone = depth > 0.7 ? waterDeep : depth < 0.35 ? waterLight : water;
        row.push((x * 5 + y * 3) % 29 === 0 ? waterLight : tone);
      }
      grid.push(row);
    }
    return grid;
  }
}
