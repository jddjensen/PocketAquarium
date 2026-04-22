import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import type { PlacedTank } from '../systems/GameState';
import { Fish, type TankBounds } from './Fish';
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

    const px = placement.col * TILE_SIZE;
    const py = placement.row * TILE_SIZE;
    const pw = placement.w * TILE_SIZE;
    const ph = placement.h * TILE_SIZE;

    this.frame = scene.add.image(px + pw / 2, py + ph / 2, `tank-${placement.w}x${placement.h}-a`);
    this.bounds = { left: px + 2, right: px + pw - 2, top: py + 2, bottom: py + ph - 2 };

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
