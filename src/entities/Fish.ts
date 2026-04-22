import Phaser from 'phaser';
import type { Species } from '../data/species';

const SWIM_SPEED = 14;
const TURN_RATE = 3.5;
const SWIM_FRAME_MS = 220;

export interface TankBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class Fish {
  private sprite: Phaser.GameObjects.Image;
  private heading: number;
  private target: Phaser.Math.Vector2;
  private wanderTimer = 0;
  private frameTimer = 0;
  private frameToggle: 'a' | 'b' = 'a';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly species: Species,
  ) {
    this.sprite = scene.add.image(x, y, `fish-${species.id}-a`);
    this.heading = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
    this.target = new Phaser.Math.Vector2(x, y);
    this.frameTimer = Math.random() * SWIM_FRAME_MS;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  destroy(): void {
    this.sprite.destroy();
  }

  update(dt: number, bounds: TankBounds): void {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.target.set(
        Phaser.Math.Between(bounds.left + 4, bounds.right - 4),
        Phaser.Math.Between(bounds.top + 4, bounds.bottom - 4),
      );
      this.wanderTimer = Phaser.Math.FloatBetween(1.5, 3.5);
    }

    const desired = Math.atan2(this.target.y - this.sprite.y, this.target.x - this.sprite.x);
    this.heading = Phaser.Math.Angle.RotateTo(this.heading, desired, TURN_RATE * dt);

    const nx = this.sprite.x + Math.cos(this.heading) * SWIM_SPEED * dt;
    const ny = this.sprite.y + Math.sin(this.heading) * SWIM_SPEED * dt;
    this.sprite.x = Phaser.Math.Clamp(nx, bounds.left + 2, bounds.right - 2);
    this.sprite.y = Phaser.Math.Clamp(ny, bounds.top + 2, bounds.bottom - 2);

    this.sprite.setFlipX(Math.cos(this.heading) < 0);

    this.frameTimer += dt * 1000;
    if (this.frameTimer >= SWIM_FRAME_MS) {
      this.frameTimer = 0;
      this.frameToggle = this.frameToggle === 'a' ? 'b' : 'a';
      this.sprite.setTexture(`fish-${this.species.id}-${this.frameToggle}`);
    }
  }
}
