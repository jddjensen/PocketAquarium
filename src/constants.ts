export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

/**
 * Legacy sprite reference size. Procedural sprites (plants, rocks, guests)
 * were authored assuming a 16-pixel unit. Not tied to the iso grid cell — kept
 * for any remaining sprite-pixel math. Tiles themselves are iso (ISO_TILE_*).
 */
export const TILE_SIZE = 16;

/**
 * Park grid dimensions. Chosen so the iso footprint (272 × 144 at 32×16 tiles)
 * fits inside the 320×180 canvas with margin for future UI chrome.
 */
export const GRID_COLS = 11;
export const GRID_ROWS = 7;

/** Isometric projection (2:1 diamond). Square grid cells render as rhombi. */
export const ISO_TILE_W = 32;
export const ISO_TILE_H = 16;
/**
 * Screen-space offsets so the 11×7 grid centers in 320×180 with ~16px side
 * margins and ~18px top/bottom for future UI frames / decor that sticks up.
 */
export const ISO_ORIGIN_X = 112;
export const ISO_ORIGIN_Y = 30;
/** Tall-wall face height above the diamond base, in pixels (unused in outdoor park). */
export const ISO_WALL_HEIGHT = 24;

/**
 * Park entrance gate — first walkable tile guests step onto. Sits on the south
 * edge so the park reads as an outdoor sanctuary with a clear entry path.
 */
export const DOOR = { col: Math.floor(GRID_COLS / 2), row: GRID_ROWS - 2 } as const;

/** Guest spawn tile — one row further south, off-map edge. */
export const ENTRANCE = { col: DOOR.col, row: GRID_ROWS - 1 } as const;

export const DEFAULT_TICKET_PRICE = 5;
export const MIN_TICKET_PRICE = 0;
export const MAX_TICKET_PRICE = 50;

/**
 * Creature Park / Safari Tycoon-style palette: warm greens, safari sand, cream
 * UI, sunset coral accents. Sourced from the reference mood board — keep
 * additions consistent with this range; avoid cool/industrial colors.
 */
export const PALETTE = {
  // Outer canvas — dim emerald, so the park sits on a subtly darker ground.
  skyDeep: 0x1d3d2e,
  // Water — jungle teal → sky blue gradient for the habitat pools.
  waterDeep: 0x1d6b6b,
  waterMid: 0x2ea7a1,
  waterLight: 0x6db7ff,
  waterSurface: 0x9fd4ff,
  // Dirt / path — safari sand range.
  sand: 0xe7c98a,
  sandShadow: 0xb89960,
  // Stone accents (benches, rocks).
  stone: 0x6b737c,
  stoneShadow: 0x4a5056,
  // Foliage — secondary plant shade used on decor plants/trees.
  plant: 0x27b26a,
  plantShadow: 0x1d3d2e,
  // Creature accent colors — reuse for fish species tints.
  fishRed: 0xff6e5b,
  fishYellow: 0xffd166,
  fishPurple: 0xc9527e,
  fishGreen: 0x4cc98b,
  fishBlue: 0x6db7ff,
  // Structures — no walls in outdoor park, but kept for fallback/decor (benches).
  wall: 0x6b737c,
  floor: 0x27b26a,
  path: 0xe7c98a,
  // UI — cream cards, deep-forest text, coral accents (wired in step 5).
  uiBg: 0xfff7e1,
  uiFg: 0x1d3d2e,
  uiAccent: 0xff6e5b,
  // Characters.
  guestSkin: 0xffd9a8,
  coin: 0xffd166,
  // Grass — primary ground everywhere.
  grass: 0x27b26a,
  grassShade: 0x1d6b43,
  grassHighlight: 0x4cc98b,
  // Legacy brick/door tokens retained so PreloadScene still compiles; no longer
  // referenced in the outdoor park but may be reused for stone/wood decor later.
  brick: 0x8b6f47,
  brickShade: 0x5a3f2a,
  brickHighlight: 0xc2a878,
  doorWood: 0x6b3f29,
  doorWoodShade: 0x3d2417,
  doorWoodHighlight: 0xa06a3f,
  doorHandle: 0xffd700,
} as const;
