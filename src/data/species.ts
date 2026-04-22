import { PALETTE } from '../constants';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  bodyColor: number;
  finColor: number;
  price: number;
  appeal: number;
  unlockReputation: number;
  size: 'small' | 'medium' | 'large';
}

export const SPECIES: Record<string, Species> = {
  goldie: {
    id: 'goldie',
    name: 'Goldie',
    rarity: 'common',
    bodyColor: PALETTE.fishYellow,
    finColor: PALETTE.fishRed,
    price: 20,
    appeal: 1,
    unlockReputation: 0,
    size: 'small',
  },
  coralfin: {
    id: 'coralfin',
    name: 'Coralfin',
    rarity: 'common',
    bodyColor: PALETTE.fishRed,
    finColor: PALETTE.fishYellow,
    price: 35,
    appeal: 2,
    unlockReputation: 0,
    size: 'small',
  },
  mossback: {
    id: 'mossback',
    name: 'Mossback',
    rarity: 'uncommon',
    bodyColor: PALETTE.plant,
    finColor: PALETTE.plantShadow,
    price: 80,
    appeal: 4,
    unlockReputation: 25,
    size: 'medium',
  },
  shadowray: {
    id: 'shadowray',
    name: 'Shadowray',
    rarity: 'rare',
    bodyColor: PALETTE.fishPurple,
    finColor: PALETTE.fishBlue,
    price: 220,
    appeal: 9,
    unlockReputation: 80,
    size: 'large',
  },
  aurorakoi: {
    id: 'aurorakoi',
    name: 'Aurorakoi',
    rarity: 'legendary',
    bodyColor: PALETTE.waterSurface,
    finColor: PALETTE.fishPurple,
    price: 600,
    appeal: 20,
    unlockReputation: 200,
    size: 'large',
  },
};

export const ALL_SPECIES: Species[] = Object.values(SPECIES);

export function speciesUnlockedAt(reputation: number): Species[] {
  return ALL_SPECIES.filter((s) => s.unlockReputation <= reputation);
}
