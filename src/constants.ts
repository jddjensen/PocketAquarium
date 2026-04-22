export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export const TILE_SIZE = 16;
export const GRID_COLS = Math.floor(GAME_WIDTH / TILE_SIZE);
export const GRID_ROWS = Math.floor(GAME_HEIGHT / TILE_SIZE);

/** Warehouse building footprint (inclusive cells for outer walls). */
export const WAREHOUSE = {
  col: 1,
  row: 1,
  w: 18,
  h: 8,
} as const;

/** Door cut into the bottom wall of the warehouse. Permanent walkable tile. */
export const DOOR = { col: 10, row: WAREHOUSE.row + WAREHOUSE.h - 1 } as const;

/** Guest spawn tile — grass, just outside the door. */
export const ENTRANCE = { col: DOOR.col, row: DOOR.row + 1 } as const;

export const DEFAULT_TICKET_PRICE = 5;
export const MIN_TICKET_PRICE = 0;
export const MAX_TICKET_PRICE = 50;

export const PALETTE = {
  skyDeep: 0x1a1c2c,
  waterDeep: 0x29366f,
  waterMid: 0x3b5dc9,
  waterLight: 0x41a6f6,
  waterSurface: 0x73eff7,
  sand: 0xf4b41b,
  sandShadow: 0xa46422,
  stone: 0x566c86,
  stoneShadow: 0x333c57,
  plant: 0x38b764,
  plantShadow: 0x257179,
  fishRed: 0xef7d57,
  fishYellow: 0xffcd75,
  fishPurple: 0xb13e53,
  fishGreen: 0x94b0c2,
  fishBlue: 0x5d275d,
  wall: 0x94b0c2,
  floor: 0xa46422,
  path: 0xf4b41b,
  uiBg: 0x1a1c2c,
  uiFg: 0xf4f4f4,
  uiAccent: 0x73eff7,
  guestSkin: 0xffcd75,
  coin: 0xffcd75,
  grass: 0x3e8948,
  grassShade: 0x265c42,
  grassHighlight: 0x63c74d,
  brick: 0x8b6f47,
  brickShade: 0x5a3f2a,
  brickHighlight: 0xc2a878,
  doorWood: 0x6b3f29,
  doorWoodShade: 0x3d2417,
  doorWoodHighlight: 0xa06a3f,
  doorHandle: 0xffd700,
} as const;
