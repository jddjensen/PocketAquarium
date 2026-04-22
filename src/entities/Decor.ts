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
    // Decor sprites were authored at 16×16 for the old 16×8 tiles. Scale 2×
     // so they match the 32×16 iso tile footprint; pixel art scales cleanly at
     // integer factors with pixelArt:true + roundPixels.
    this.sprite = scene.add
      .image(x, y + ISO_TILE_H / 2, `decor-${placement.kind}`)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(Grid.tileDepth(placement.col, placement.row));
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
