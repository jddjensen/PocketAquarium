import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, TILE_SIZE } from '../constants';
import { ALL_SPECIES } from '../data/species';

type PixelGrid = (number | null)[][];

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.drawLoadingBar();
  }

  create(): void {
    this.generatePixelTextures();
    this.scene.start('ParkScene');
    this.scene.launch('UIScene');
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
      this.drawGrid(`fish-${species.id}`, this.fishGrid(species.bodyColor, species.finColor, species.size));
    }
    this.drawGrid('decor-plant', this.plantGrid());
    this.drawGrid('decor-rock', this.rockGrid());
    this.drawGrid('guest', this.guestGrid());
    this.drawGrid('tile-path', this.pathTileGrid());
    this.drawGrid('tile-floor', this.floorTileGrid());

    const tankSizes: [number, number][] = [
      [2, 2],
      [3, 2],
      [4, 2],
      [3, 3],
      [4, 3],
    ];
    for (const [w, h] of tankSizes) {
      this.drawGrid(`tank-${w}x${h}`, this.tankGrid(w, h));
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

  private fishGrid(body: number, fin: number, size: 'small' | 'medium' | 'large'): PixelGrid {
    const _ = null;
    if (size === 'small') {
      return [
        [_, _, _, body, body, body, _, _],
        [_, body, body, body, body, body, body, _],
        [fin, body, body, body, body, 0x000000, body, body],
        [_, body, body, body, body, body, body, _],
        [_, _, _, body, body, body, _, _],
      ];
    }
    if (size === 'medium') {
      return [
        [_, _, _, _, body, body, body, body, _, _],
        [_, _, body, body, body, body, body, body, body, _],
        [fin, fin, body, body, body, body, body, 0x000000, body, body],
        [_, _, body, body, body, body, body, body, body, _],
        [_, _, _, _, body, body, body, body, _, _],
      ];
    }
    return [
      [_, _, _, _, _, body, body, body, body, body, _, _],
      [_, _, _, body, body, body, body, body, body, body, body, _],
      [_, fin, body, body, body, body, body, body, body, body, body, body],
      [fin, fin, body, body, body, body, body, body, body, 0x000000, body, body],
      [_, fin, body, body, body, body, body, body, body, body, body, body],
      [_, _, _, body, body, body, body, body, body, body, body, _],
      [_, _, _, _, _, body, body, body, body, body, _, _],
    ];
  }

  private plantGrid(): PixelGrid {
    const _ = null;
    const p = PALETTE.plant;
    const s = PALETTE.plantShadow;
    return [
      [_, _, _, p, _, _, p, _, _, _, _, _, _, _, _, _],
      [_, _, p, p, p, _, p, p, _, _, _, p, _, _, _, _],
      [_, _, p, p, p, p, p, p, p, _, _, p, p, _, _, _],
      [_, p, p, s, p, p, s, p, p, p, p, p, p, _, _, _],
      [_, p, s, s, p, s, s, s, p, p, s, s, p, _, _, _],
      [_, p, p, s, s, s, s, s, s, s, s, p, p, _, _, _],
      [_, _, p, p, s, s, s, s, s, s, p, p, _, _, _, _],
      [_, _, _, p, p, s, s, s, s, p, p, _, _, _, _, _],
      [_, _, _, _, p, p, s, s, p, p, _, _, _, _, _, _],
      [_, _, _, _, _, p, p, p, p, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, p, p, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, p, p, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, s, p, p, s, _, _, _, _, _, _, _],
      [_, _, _, _, s, s, s, s, s, s, _, _, _, _, _, _],
      [_, _, _, s, s, s, s, s, s, s, s, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  private rockGrid(): PixelGrid {
    const _ = null;
    const r = PALETTE.stone;
    const s = PALETTE.stoneShadow;
    return [
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, r, r, r, r, _, _, _, _, _, _, _],
      [_, _, _, _, r, r, r, r, r, r, _, _, _, _, _, _],
      [_, _, _, r, r, r, r, r, r, r, r, _, _, _, _, _],
      [_, _, r, r, r, r, r, r, r, r, r, r, _, _, _, _],
      [_, r, r, r, r, r, r, r, r, r, r, r, r, _, _, _],
      [_, r, r, r, r, r, r, s, s, r, r, r, r, _, _, _],
      [r, r, r, r, r, s, s, s, s, s, r, r, r, r, _, _],
      [r, r, r, s, s, s, s, s, s, s, s, r, r, r, _, _],
      [r, r, s, s, s, s, s, s, s, s, s, s, r, r, _, _],
      [r, s, s, s, s, s, s, s, s, s, s, s, s, r, _, _],
      [s, s, s, s, s, s, s, s, s, s, s, s, s, s, _, _],
      [s, s, s, s, s, s, s, s, s, s, s, s, s, s, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];
  }

  private guestGrid(): PixelGrid {
    const _ = null;
    const skin = PALETTE.guestSkin;
    const shirt = PALETTE.fishRed;
    const hair = PALETTE.stoneShadow;
    const pants = PALETTE.waterDeep;
    return [
      [_, _, hair, hair, hair, _, _, _],
      [_, hair, skin, skin, skin, hair, _, _],
      [_, hair, skin, 0, skin, 0, _, _],
      [_, _, skin, skin, skin, _, _, _],
      [_, shirt, shirt, shirt, shirt, shirt, _, _],
      [_, shirt, shirt, shirt, shirt, shirt, _, _],
      [_, pants, pants, _, pants, pants, _, _],
      [_, pants, _, _, _, pants, _, _],
    ];
  }

  private pathTileGrid(): PixelGrid {
    const base = PALETTE.path;
    const dark = PALETTE.sandShadow;
    const grid: PixelGrid = [];
    for (let y = 0; y < TILE_SIZE; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < TILE_SIZE; x++) {
        const edge = x === 0 || y === 0 || x === TILE_SIZE - 1 || y === TILE_SIZE - 1;
        const speck = (x * 7 + y * 13) % 17 === 0;
        row.push(edge ? dark : speck ? dark : base);
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
        row.push((x + y) % 5 === 0 ? dark : base);
      }
      grid.push(row);
    }
    return grid;
  }

  private tankGrid(cols: number, rows: number): PixelGrid {
    const w = cols * TILE_SIZE;
    const h = rows * TILE_SIZE;
    const water = PALETTE.waterMid;
    const waterLight = PALETTE.waterLight;
    const surface = PALETTE.waterSurface;
    const frame = PALETTE.stoneShadow;
    const frameLight = PALETTE.stone;
    const grid: PixelGrid = [];
    for (let y = 0; y < h; y++) {
      const row: (number | null)[] = [];
      for (let x = 0; x < w; x++) {
        const onFrame = x <= 1 || y <= 1 || x >= w - 2 || y >= h - 2;
        if (onFrame) {
          const lit = x <= 1 || y <= 1;
          row.push(lit ? frameLight : frame);
          continue;
        }
        if (y <= 3) {
          row.push(surface);
          continue;
        }
        row.push((x + y) % 7 === 0 ? waterLight : water);
      }
      grid.push(row);
    }
    return grid;
  }
}
