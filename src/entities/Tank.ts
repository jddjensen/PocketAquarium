import Phaser from 'phaser';
import { ISO_TILE_H, ISO_TILE_W } from '../constants';
import type { PlacedTank } from '../systems/GameState';
import { Fish, type TankBounds } from './Fish';
import { Grid } from '../world/Grid';
import { SPECIES, type Species } from '../data/species';

const RIPPLE_FRAME_MS = 600;

export class Tank {
  readonly id: string;
  private readonly frame: Phaser.GameObjects.Image;
  private readonly fish: Fish[] = [];
  private readonly bounds: TankBounds;
  private rippleTimer = 0;
  private rippleToggle: 'a' | 'b' = 'a';

  constructor(
    private readonly scene: Phaser.Scene,
    readonly placement: PlacedTank,
  ) {
    this.id = placement.id;

    // Iso center of the tank's footprint — use the rhombus's geometric center,
    // which projects from the half-tile midpoint of the N×M rectangle.
    const center = Grid.tileToWorld(
      placement.col + placement.w / 2 - 0.5,
      placement.row + placement.h / 2 - 0.5,
    );
    this.frame = scene.add
      .image(center.x, center.y, `tank-${placement.w}x${placement.h}-a`)
      .setOrigin(0.5, 0.5)
      .setDepth(Grid.tileDepth(placement.col + placement.w - 1, placement.row + placement.h - 1));

    // Fish swim in the axis-aligned rect inscribed in the rhombus (half the
    // rhombus's width and height, centered on the tank). This keeps fish motion
    // simple while visually reading as "inside the pool".
    const rhombusW = (placement.w + placement.h) * (ISO_TILE_W / 2);
    const rhombusH = (placement.w + placement.h) * (ISO_TILE_H / 2);
    const innerW = rhombusW / 2;
    const innerH = rhombusH / 2;
    this.bounds = {
      left: center.x - innerW / 2 + 2,
      right: center.x + innerW / 2 - 2,
      top: center.y - innerH / 2 + 2,
      bottom: center.y + innerH / 2 - 2,
    };

    for (const speciesId of placement.fishSpeciesIds) {
      const species = SPECIES[speciesId];
      if (species) this.addFish(species);
    }
  }

  get appeal(): number {
    return this.fish.reduce((sum, f) => sum + f.species.appeal, 0);
  }

  get centerWorld(): { x: number; y: number } {
    return { x: this.frame.x, y: this.frame.y };
  }

  get speciesIds(): string[] {
    return this.fish.map((f) => f.species.id);
  }

  get capacity(): number {
    return this.placement.w * this.placement.h;
  }

  canHoldMore(): boolean {
    return this.fish.length < this.capacity;
  }

  addFish(species: Species): boolean {
    if (!this.canHoldMore()) return false;
    const x = Phaser.Math.Between(this.bounds.left + 2, this.bounds.right - 2);
    const y = Phaser.Math.Between(this.bounds.top + 2, this.bounds.bottom - 2);
    const fish = new Fish(this.scene, x, y, species);
    // Fish render just above the tank's water surface but below objects in
    // front of the tank in iso depth order.
    fish.setDepth(this.frame.depth + 0.1);
    this.fish.push(fish);
    this.placement.fishSpeciesIds.push(species.id);
    return true;
  }

  contains(col: number, row: number): boolean {
    return (
      col >= this.placement.col &&
      col < this.placement.col + this.placement.w &&
      row >= this.placement.row &&
      row < this.placement.row + this.placement.h
    );
  }

  update(dt: number): void {
    for (const fish of this.fish) fish.update(dt, this.bounds);

    this.rippleTimer += dt * 1000;
    if (this.rippleTimer >= RIPPLE_FRAME_MS) {
      this.rippleTimer = 0;
      this.rippleToggle = this.rippleToggle === 'a' ? 'b' : 'a';
      this.frame.setTexture(`tank-${this.placement.w}x${this.placement.h}-${this.rippleToggle}`);
    }
  }

  destroy(): void {
    this.frame.destroy();
    for (const fish of this.fish) fish.destroy();
    this.fish.length = 0;
  }
}
