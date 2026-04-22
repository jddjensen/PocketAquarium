import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { Grid } from '../world/Grid';

const WALK_SPEED = 18;
const VIEW_TIME = 2.5;
const WALK_FRAME_MS = 220;

export type GuestState = 'walking' | 'viewing' | 'leaving';
type Facing = 'down' | 'up' | 'left' | 'right';

export interface GuestCallbacks {
  onView: (guest: Guest, col: number, row: number) => number;
  onExit: (guest: Guest, satisfaction: number) => void;
}

export class Guest {
  private sprite: Phaser.GameObjects.Image;
  private pathIdx = 0;
  private state: GuestState = 'walking';
  private viewTimer = 0;
  private satisfaction = 0;
  private facing: Facing = 'down';
  private frameTimer = 0;
  private walkFrame: 0 | 1 = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly path: { col: number; row: number }[],
    private readonly callbacks: GuestCallbacks,
  ) {
    const start = path[0] ?? { col: 0, row: 0 };
    const { x, y } = Grid.tileToWorld(start.col, start.row);
    this.sprite = scene.add.image(x, y, 'guest-down-0');
  }

  update(dt: number): boolean {
    if (this.state === 'viewing') {
      this.viewTimer -= dt;
      this.setFrame(0);
      if (this.viewTimer <= 0) this.state = 'walking';
      return true;
    }

    const next = this.path[this.pathIdx + 1];
    if (!next) {
      this.callbacks.onExit(this, this.satisfaction);
      this.sprite.destroy();
      return false;
    }

    const { x: tx, y: ty } = Grid.tileToWorld(next.col, next.row);
    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const step = WALK_SPEED * dt;

    this.updateFacing(dx, dy);

    if (dist <= step) {
      this.sprite.x = tx;
      this.sprite.y = ty;
      this.pathIdx += 1;
      this.checkForTankView(next.col, next.row);
    } else {
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
    }

    this.frameTimer += dt * 1000;
    if (this.frameTimer >= WALK_FRAME_MS) {
      this.frameTimer = 0;
      this.setFrame(this.walkFrame === 0 ? 1 : 0);
    }
    return true;
  }

  private updateFacing(dx: number, dy: number): void {
    const nextFacing: Facing =
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    if (nextFacing !== this.facing) {
      this.facing = nextFacing;
      this.applyTexture();
    }
    this.sprite.setFlipX(this.facing === 'right');
  }

  private setFrame(frame: 0 | 1): void {
    if (this.walkFrame === frame) return;
    this.walkFrame = frame;
    this.applyTexture();
  }

  private applyTexture(): void {
    const textureDir = this.facing === 'right' ? 'left' : this.facing;
    this.sprite.setTexture(`guest-${textureDir}-${this.walkFrame}`);
    this.sprite.setFlipX(this.facing === 'right');
  }

  private checkForTankView(col: number, row: number): void {
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const appeal = this.callbacks.onView(this, col + dc, row + dr);
      if (appeal > 0) {
        this.satisfaction += appeal;
        this.state = 'viewing';
        this.viewTimer = VIEW_TIME;
        return;
      }
    }
  }

  get positionWorld(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  static tilesBetween(
    from: { col: number; row: number },
    to: { col: number; row: number },
    pathTiles: Set<string>,
  ): { col: number; row: number }[] {
    const key = (c: number, r: number) => `${c},${r}`;
    const queue: { col: number; row: number }[][] = [[from]];
    const seen = new Set<string>([key(from.col, from.row)]);
    while (queue.length) {
      const path = queue.shift();
      if (!path) break;
      const tail = path[path.length - 1];
      if (!tail) continue;
      if (tail.col === to.col && tail.row === to.row) return path;
      for (const [dc, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nc = tail.col + dc;
        const nr = tail.row + dr;
        const k = key(nc, nr);
        if (seen.has(k)) continue;
        if (!pathTiles.has(k) && !(nc === to.col && nr === to.row)) continue;
        seen.add(k);
        queue.push([...path, { col: nc, row: nr }]);
      }
    }
    return [];
  }
}

export const GUEST_TILE_OFFSET = TILE_SIZE / 2;
