/**
 * Decor catalog — the canonical source for every placeable decor type.
 * `cost` is spent on placement and 20% is refunded on erase (see ParkScene).
 * `appeal` feeds into `ParkScene.willingnessToPay` (step 6 balance pass).
 * `scale` matches the procedural/PixelLab sprite size to the 32×16 iso tile —
 * small procedural (16×16) art scales 2×, PixelLab-sourced sprites are
 * already authored at on-screen size so scale 1.
 */
export type DecorKind = 'plant' | 'rock' | 'tree' | 'bench' | 'flowerbed' | 'fountain';

export interface DecorSpec {
  kind: DecorKind;
  label: string;
  cost: number;
  appeal: number;
  scale: 1 | 2;
}

export const DECOR_CATALOG: Record<DecorKind, DecorSpec> = {
  plant: { kind: 'plant', label: 'plant', cost: 15, appeal: 1, scale: 2 },
  rock: { kind: 'rock', label: 'rock', cost: 10, appeal: 0, scale: 2 },
  tree: { kind: 'tree', label: 'tree', cost: 25, appeal: 2, scale: 1 },
  bench: { kind: 'bench', label: 'bench', cost: 20, appeal: 1, scale: 1 },
  flowerbed: { kind: 'flowerbed', label: 'flowers', cost: 18, appeal: 2, scale: 1 },
  fountain: { kind: 'fountain', label: 'fountain', cost: 60, appeal: 4, scale: 1 },
};

export const ALL_DECOR = Object.values(DECOR_CATALOG);
