import Phaser from 'phaser';
import { ISO_TILE_H } from '../constants';
import type { PlacedDecor } from '../systems/GameState';
import { Grid } from '../world/Grid';

export class Decor {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, readonly placement: PlacedDecor) {
    const { x, y } = Grid.tileToWorld(placement.col, placement.row);
    // Decor sprites are taller than an iso tile (plants/rocks are 16×16 in a
    // 16×8 diamond). Anchor bottom-center to the tile's bottom point so the
    // sprite appears to stand on the tile.
    this.sprite = scene.add
      .image(x, y + ISO_TILE_H / 2, `decor-${placement.kind}`)
      .setOrigin(0.5, 1)
      .setDepth(Grid.tileDepth(placement.col, placement.row));
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
