import { PALETTE } from '../constants';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SpeciesPalette {
  shadow: number;
  base: number;
  highlight: number;
  fin: number;
  eye: number;
}

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  palette: SpeciesPalette;
  price: number;
  appeal: number;
  unlockReputation: number;
  size: 'small' | 'medium' | 'large';
}

function shift(color: number, amount: number): number {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (color & 0xff) + amount));
  return (r << 16) | (g << 8) | b;
}

function makePalette(base: number, fin: number): SpeciesPalette {
  return {
    shadow: shift(base, -60),
    base,
    highlight: shift(base, 50),
    fin,
    eye: 0x1a1c2c,
  };
}

export const SPECIES: Record<string, Species> = {
  goldie: {
    id: 'goldie',
    name: 'Goldie',
    rarity: 'common',
    palette: makePalette(PALETTE.fishYellow, PALETTE.fishRed),
    price: 20,
    appeal: 1,
    unlockReputation: 0,
    size: 'small',
  },
  coralfin: {
    id: 'coralfin',
    name: 'Coralfin',
    rarity: 'common',
    palette: makePalette(PALETTE.fishRed, PALETTE.fishYellow),
    price: 35,
    appeal: 2,
    unlockReputation: 0,
    size: 'small',
  },
  bubbletetra: {
    id: 'bubbletetra',
    name: 'Bubbletetra',
    rarity: 'common',
    palette: makePalette(PALETTE.waterMid, PALETTE.fishYellow),
    price: 50,
    appeal: 2,
    unlockReputation: 12,
    size: 'small',
  },
  mossback: {
    id: 'mossback',
    name: 'Mossback',
    rarity: 'uncommon',
    palette: makePalette(PALETTE.plant, PALETTE.plantShadow),
    price: 85,
    appeal: 4,
    unlockReputation: 30,
    size: 'medium',
  },
  sunstripe: {
    id: 'sunstripe',
    name: 'Sunstripe',
    rarity: 'uncommon',
    palette: makePalette(PALETTE.fishYellow, PALETTE.fishGreen),
    price: 120,
    appeal: 5,
    unlockReputation: 55,
    size: 'small',
  },
  kelpkoi: {
    id: 'kelpkoi',
    name: 'Kelpkoi',
    rarity: 'uncommon',
    palette: makePalette(PALETTE.fishGreen, PALETTE.fishYellow),
    price: 165,
    appeal: 7,
    unlockReputation: 85,
    size: 'medium',
  },
  shadowray: {
    id: 'shadowray',
    name: 'Shadowray',
    rarity: 'rare',
    palette: makePalette(PALETTE.fishPurple, PALETTE.fishBlue),
    price: 240,
    appeal: 10,
    unlockReputation: 125,
    size: 'large',
  },
  emberfin: {
    id: 'emberfin',
    name: 'Emberfin',
    rarity: 'rare',
    palette: makePalette(PALETTE.fishRed, PALETTE.fishPurple),
    price: 320,
    appeal: 13,
    unlockReputation: 175,
    size: 'medium',
  },
  blueglass: {
    id: 'blueglass',
    name: 'Blueglass',
    rarity: 'rare',
    palette: makePalette(PALETTE.waterSurface, PALETTE.waterDeep),
    price: 430,
    appeal: 16,
    unlockReputation: 235,
    size: 'small',
  },
  aurorakoi: {
    id: 'aurorakoi',
    name: 'Aurorakoi',
    rarity: 'legendary',
    palette: makePalette(PALETTE.waterSurface, PALETTE.fishPurple),
    price: 700,
    appeal: 24,
    unlockReputation: 320,
    size: 'large',
  },
};

export const ALL_SPECIES: Species[] = Object.values(SPECIES);

export function speciesUnlockedAt(reputation: number): Species[] {
  return ALL_SPECIES.filter((s) => s.unlockReputation <= reputation);
}
