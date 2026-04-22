import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../constants';

export type TileKind = 'empty' | 'floor' | 'path' | 'tank' | 'decor' | 'wall';

export interface Tile {
  kind: TileKind;
  ownerId?: string;
}

export class Grid {
  private tiles: Tile[][];

  constructor(
    readonly cols: number = GRID_COLS,
    readonly rows: number = GRID_ROWS,
  ) {
    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (): Tile => ({ kind: 'floor' })),
    );
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  get(col: number, row: number): Tile | null {
    return this.inBounds(col, row) ? (this.tiles[row]?.[col] ?? null) : null;
  }

  set(col: number, row: number, tile: Tile): void {
    if (!this.inBounds(col, row)) return;
    const rowArr = this.tiles[row];
    if (rowArr) rowArr[col] = tile;
  }

  isFree(col: number, row: number): boolean {
    const t = this.get(col, row);
    return t?.kind === 'floor';
  }

  isWalkable(col: number, row: number): boolean {
    const t = this.get(col, row);
    return t?.kind === 'path' || t?.kind === 'floor';
  }

  static tileToWorld(col: number, row: number): { x: number; y: number } {
    return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
  }

  static worldToTile(x: number, y: number): { col: number; row: number } {
    return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
  }
}
