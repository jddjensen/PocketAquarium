import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRID_COLS, GRID_ROWS, PALETTE, TILE_SIZE } from '../constants';
import { Grid } from '../world/Grid';
import { Tank } from '../entities/Tank';
import { Decor } from '../entities/Decor';
import { Guest } from '../entities/Guest';
import { gameState, type BuildTool } from '../systems/GameState';
import { SPECIES, speciesUnlockedAt } from '../data/species';

const ENTRANCE = { col: 0, row: GRID_ROWS - 1 };
const TANK_BASE_COST = 50;
const PATH_COST = 5;
const DECOR_PLANT_COST = 15;
const DECOR_ROCK_COST = 10;
const TICKET_PRICE = 3;
const SAVE_INTERVAL_MS = 5000;

export class ParkScene extends Phaser.Scene {
  private grid!: Grid;
  private tileLayer!: Phaser.GameObjects.Container;
  private hoverMarker!: Phaser.GameObjects.Rectangle;
  private tanks: Tank[] = [];
  private decor: Decor[] = [];
  private guests: Guest[] = [];
  private guestSpawnTimer = 0;
  private saveTimer = 0;
  private unsubscribe?: () => void;

  constructor() {
    super({ key: 'ParkScene' });
  }

  create(): void {
    this.grid = new Grid();
    this.drawBackdrop();
    this.tileLayer = this.add.container(0, 0);
    this.hoverMarker = this.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE, PALETTE.uiAccent, 0.25)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PALETTE.uiAccent)
      .setVisible(false);

    this.hydrateFromState();
    this.unsubscribe = gameState.subscribe(() => this.hydrateFromState());

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerdown', this.onPointerDown, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      gameState.save();
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    for (const tank of this.tanks) tank.update(dt);
    for (let i = this.guests.length - 1; i >= 0; i--) {
      const guest = this.guests[i];
      if (!guest) continue;
      if (!guest.update(dt)) this.guests.splice(i, 1);
    }

    this.guestSpawnTimer -= dt;
    if (this.guestSpawnTimer <= 0) {
      this.trySpawnGuest();
      const attractiveness = this.totalAppeal();
      const nextDelay = Math.max(1.5, 8 - attractiveness * 0.15);
      this.guestSpawnTimer = nextDelay;
    }

    this.saveTimer += delta;
    if (this.saveTimer >= SAVE_INTERVAL_MS) {
      this.saveTimer = 0;
      gameState.save();
    }
  }

  private drawBackdrop(): void {
    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.skyDeep, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, 'tile-floor').setOrigin(0, 0).setDepth(-10);
      }
    }
    this.add
      .rectangle(ENTRANCE.col * TILE_SIZE, ENTRANCE.row * TILE_SIZE, TILE_SIZE, TILE_SIZE, PALETTE.uiAccent, 0.3)
      .setOrigin(0, 0)
      .setDepth(-5);
  }

  private hydrateFromState(): void {
    this.tileLayer.removeAll(true);
    for (const t of this.tanks) t.destroy();
    for (const d of this.decor) d.destroy();
    this.tanks = [];
    this.decor = [];

    const snap = gameState.snapshot;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.grid.set(c, r, { kind: 'floor' });
      }
    }

    for (const p of snap.paths) {
      const tile = this.add.image(p.col * TILE_SIZE, p.row * TILE_SIZE, 'tile-path').setOrigin(0, 0);
      this.tileLayer.add(tile);
      this.grid.set(p.col, p.row, { kind: 'path' });
    }

    for (const d of snap.decor) {
      this.decor.push(new Decor(this, d));
      this.grid.set(d.col, d.row, { kind: 'decor', ownerId: d.id });
    }

    for (const t of snap.tanks) {
      const tank = new Tank(this, t);
      this.tanks.push(tank);
      for (let r = t.row; r < t.row + t.h; r++) {
        for (let c = t.col; c < t.col + t.w; c++) {
          this.grid.set(c, r, { kind: 'tank', ownerId: t.id });
        }
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const { col, row } = Grid.worldToTile(pointer.worldX, pointer.worldY);
    if (!this.grid.inBounds(col, row)) {
      this.hoverMarker.setVisible(false);
      return;
    }
    const tool = gameState.snapshot.tool;
    if (tool.kind === 'none') {
      this.hoverMarker.setVisible(false);
      return;
    }
    this.hoverMarker.setPosition(col * TILE_SIZE, row * TILE_SIZE);
    if (tool.kind === 'tank') {
      this.hoverMarker.setSize(tool.size.w * TILE_SIZE, tool.size.h * TILE_SIZE);
    } else {
      this.hoverMarker.setSize(TILE_SIZE, TILE_SIZE);
    }
    this.hoverMarker.setVisible(true);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const { col, row } = Grid.worldToTile(pointer.worldX, pointer.worldY);
    if (!this.grid.inBounds(col, row)) return;
    const tool = gameState.snapshot.tool;
    this.applyTool(tool, col, row);
  }

  private applyTool(tool: BuildTool, col: number, row: number): void {
    switch (tool.kind) {
      case 'path':
        if (!this.grid.isFree(col, row)) return;
        if (!gameState.spend(PATH_COST)) return;
        gameState.addPath({ col, row });
        return;
      case 'decor': {
        if (!this.grid.isFree(col, row)) return;
        const cost = tool.decor === 'plant' ? DECOR_PLANT_COST : DECOR_ROCK_COST;
        if (!gameState.spend(cost)) return;
        gameState.addDecor({ id: crypto.randomUUID(), col, row, kind: tool.decor });
        return;
      }
      case 'tank': {
        const { w, h } = tool.size;
        for (let r = row; r < row + h; r++) {
          for (let c = col; c < col + w; c++) {
            if (!this.grid.isFree(c, r)) return;
          }
        }
        const cost = TANK_BASE_COST * w * h;
        if (!gameState.spend(cost)) return;
        gameState.addTank({
          id: crypto.randomUUID(),
          col,
          row,
          w,
          h,
          fishSpeciesIds: [],
        });
        return;
      }
      case 'fish': {
        const tank = gameState.findTankAt(col, row);
        if (!tank) return;
        const species = SPECIES[tool.speciesId];
        if (!species) return;
        if (species.unlockReputation > gameState.snapshot.reputation) return;
        if (tank.fishSpeciesIds.length >= tank.w * tank.h) return;
        if (!gameState.spend(species.price)) return;
        tank.fishSpeciesIds.push(species.id);
        gameState.recordCatch(species.id);
        this.hydrateFromState();
        return;
      }
      case 'erase': {
        const removed = gameState.removeAt(col, row);
        if (removed) gameState.earn(2);
        return;
      }
      case 'none':
        return;
    }
  }

  private totalAppeal(): number {
    return this.tanks.reduce((sum, t) => sum + t.appeal, 0);
  }

  private trySpawnGuest(): void {
    if (this.tanks.length === 0) return;
    if (gameState.snapshot.paths.length === 0) return;
    const pathTiles = new Set(gameState.snapshot.paths.map((p) => `${p.col},${p.row}`));
    const pathList = [...gameState.snapshot.paths];
    const destination = pathList[Math.floor(Math.random() * pathList.length)];
    if (!destination) return;
    const toDest = Guest.tilesBetween(ENTRANCE, destination, pathTiles);
    if (toDest.length === 0) return;
    const roundTrip = [...toDest, ...toDest.slice(0, -1).reverse()];
    gameState.earn(TICKET_PRICE);
    const unlocked = speciesUnlockedAt(gameState.snapshot.reputation).length;
    const guest = new Guest(this, roundTrip, {
      onView: (_g, c, r) => {
        const tank = this.tanks.find((t) => t.contains(c, r));
        return tank ? tank.appeal : 0;
      },
      onExit: (_g, satisfaction) => {
        const repGain = Math.floor(satisfaction / 2);
        if (repGain > 0) gameState.addReputation(repGain);
        const unlockedNow = speciesUnlockedAt(gameState.snapshot.reputation).length;
        if (unlockedNow > unlocked) {
          this.cameras.main.flash(200, 115, 239, 247);
        }
      },
    });
    this.guests.push(guest);
  }
}
