import {
  DOOR,
  GRID_COLS,
  GRID_ROWS,
  ISO_ORIGIN_X,
  ISO_ORIGIN_Y,
  ISO_TILE_H,
  ISO_TILE_W,
} from '../constants';

export type TileKind = 'door' | 'floor' | 'path' | 'tank' | 'decor';

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
    this.applyWarehouseLayout();
  }

  /**
   * Reset the whole grid to buildable grass with the park gate stamped at the
   * south edge. Called on hydrate so placements are re-applied from authority
   * (save state) cleanly.
   */
  applyWarehouseLayout(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r]![c] = { kind: 'floor' };
      }
    }
    this.tiles[DOOR.row]![DOOR.col] = { kind: 'door' };
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

  /** Placement is only allowed on plain warehouse floor. */
  isFree(col: number, row: number): boolean {
    const t = this.get(col, row);
    return t?.kind === 'floor';
  }

  isWalkable(col: number, row: number): boolean {
    const t = this.get(col, row);
    return t?.kind === 'path' || t?.kind === 'door';
  }

  /**
   * Iso projection of a tile (or half-tile — col/row may be fractional for
   * centering multi-tile sprites). Returns the screen-space position of the
   * diamond center.
   */
  static tileToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: ISO_ORIGIN_X + (col - row) * (ISO_TILE_W / 2),
      y: ISO_ORIGIN_Y + (col + row) * (ISO_TILE_H / 2),
    };
  }

  /** Inverse iso projection. Screen coords → integer tile coords. */
  static worldToTile(x: number, y: number): { col: number; row: number } {
    const lx = (x - ISO_ORIGIN_X) / (ISO_TILE_W / 2);
    const ly = (y - ISO_ORIGIN_Y) / (ISO_TILE_H / 2);
    return {
      col: Math.floor((lx + ly) / 2),
      row: Math.floor((ly - lx) / 2),
    };
  }

  /** Back-to-front painter-sort key. Larger = drawn on top. */
  static tileDepth(col: number, row: number): number {
    return col + row;
  }
}
