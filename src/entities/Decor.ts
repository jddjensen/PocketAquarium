import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import type { PlacedDecor } from '../systems/GameState';

export class Decor {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, readonly placement: PlacedDecor) {
    const { x, y } = {
      x: placement.col * TILE_SIZE + TILE_SIZE / 2,
      y: placement.row * TILE_SIZE + TILE_SIZE / 2,
    };
    this.sprite = scene.add.image(x, y, `decor-${placement.kind}`);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
