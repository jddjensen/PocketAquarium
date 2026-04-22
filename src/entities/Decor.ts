import Phaser from 'phaser';
import { ISO_TILE_H } from '../constants';
import type { PlacedDecor } from '../systems/GameState';
import { Grid } from '../world/Grid';
import { DECOR_CATALOG } from '../data/decor';

export class Decor {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, readonly placement: PlacedDecor) {
    const { x, y } = Grid.tileToWorld(placement.col, placement.row);
    const spec = DECOR_CATALOG[placement.kind];
    // Anchor bottom-center at the tile's bottom diamond vertex so decor
    // "stands on" the tile. Scale per-kind — procedural 16×16 art uses 2×,
    // PixelLab sprites are authored at on-screen size so use 1×.
    this.sprite = scene.add
      .image(x, y + ISO_TILE_H / 2, `decor-${placement.kind}`)
      .setOrigin(0.5, 1)
      .setScale(spec?.scale ?? 1)
      .setDepth(Grid.tileDepth(placement.col, placement.row));
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
