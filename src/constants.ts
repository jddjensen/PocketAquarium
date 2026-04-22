export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export const TILE_SIZE = 16;
export const GRID_COLS = GAME_WIDTH / TILE_SIZE;
export const GRID_ROWS = GAME_HEIGHT / TILE_SIZE;

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
} as const;
