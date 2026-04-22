import Phaser from 'phaser';
import {
  DOOR,
  ENTRANCE,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_COLS,
  GRID_ROWS,
  PALETTE,
  TILE_SIZE,
} from '../constants';
import { Grid } from '../world/Grid';
import { Tank } from '../entities/Tank';
import { Decor } from '../entities/Decor';
import { Guest } from '../entities/Guest';
import { gameState, type BuildTool } from '../systems/GameState';
import { SPECIES, speciesUnlockedAt } from '../data/species';

const TANK_BASE_COST = 50;
const PATH_COST = 5;
const DECOR_PLANT_COST = 15;
const DECOR_ROCK_COST = 10;
const SAVE_INTERVAL_MS = 5000;

/**
 * Willingness-to-pay model:
 *   willingness = BASE + attractiveness * APPEAL_WEIGHT + crowdTerm
 * where crowdTerm starts mildly positive (social proof) up to a soft cap
 * scaling with path size, then sharply negative (congestion penalty).
 */
const WILLINGNESS_BASE = 3;
const APPEAL_WEIGHT = 0.5;
const CROWD_SOCIAL_BONUS = 2;
const CROWD_PENALTY_SLOPE = 5;


export class ParkScene extends Phaser.Scene {
  private grid!: Grid;
  private placementLayer!: Phaser.GameObjects.Container;
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
    this.placementLayer = this.add.container(0, 0);
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
      const demand = this.demand();
      if (demand > 0) {
        this.trySpawnGuest();
        // Higher demand → faster arrivals; floor at 1.2s between spawns.
        this.guestSpawnTimer = Math.max(1.2, 7 - demand * 0.4);
      } else {
        // Price too high for what the park offers — check again soon.
        this.guestSpawnTimer = 2.5;
      }
    }

    this.saveTimer += delta;
    if (this.saveTimer >= SAVE_INTERVAL_MS) {
      this.saveTimer = 0;
      gameState.save();
    }
  }

  /**
   * Static backdrop: grass everywhere, warehouse floor inside the walls, brick
   * walls around the perimeter, and the door cut into the bottom wall.
   */
  private drawBackdrop(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.grid.get(c, r);
        if (!tile) continue;
        let key: string;
        switch (tile.kind) {
          case 'exterior':
            key = 'tile-grass';
            break;
          case 'wall':
            key = 'tile-wall';
            break;
          case 'door':
            key = 'tile-door';
            break;
          default:
            key = 'tile-floor';
            break;
        }
        this.add.image(c * TILE_SIZE, r * TILE_SIZE, key).setOrigin(0, 0).setDepth(-10);
      }
    }

    // Welcome path on the grass leading up to the door (cosmetic).
    const spawnWorld = Grid.tileToWorld(ENTRANCE.col, ENTRANCE.row);
    this.add
      .rectangle(
        spawnWorld.x,
        spawnWorld.y - TILE_SIZE / 4,
        TILE_SIZE - 2,
        TILE_SIZE - 6,
        PALETTE.path,
        0.7,
      )
      .setDepth(-9);
  }

  private hydrateFromState(): void {
    this.placementLayer.removeAll(true);
    for (const t of this.tanks) t.destroy();
    for (const d of this.decor) d.destroy();
    this.tanks = [];
    this.decor = [];

    // Re-stamp the warehouse layout, then apply placements on top.
    this.grid.applyWarehouseLayout();

    const snap = gameState.snapshot;

    for (const p of snap.paths) {
      if (!this.grid.inBounds(p.col, p.row)) continue;
      if (this.grid.get(p.col, p.row)?.kind !== 'floor') continue;
      const tile = this.add
        .image(p.col * TILE_SIZE, p.row * TILE_SIZE, 'tile-path')
        .setOrigin(0, 0);
      this.placementLayer.add(tile);
      this.grid.set(p.col, p.row, { kind: 'path' });
    }

    for (const d of snap.decor) {
      if (!this.grid.inBounds(d.col, d.row)) continue;
      this.decor.push(new Decor(this, d));
      this.grid.set(d.col, d.row, { kind: 'decor', ownerId: d.id });
    }

    for (const t of snap.tanks) {
      let okToPlace = true;
      for (let r = t.row; r < t.row + t.h; r++) {
        for (let c = t.col; c < t.col + t.w; c++) {
          const kind = this.grid.get(c, r)?.kind;
          if (kind !== 'floor' && kind !== 'path' && kind !== 'decor') {
            okToPlace = false;
          }
        }
      }
      if (!okToPlace) continue;
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
    const valid = this.isPlacementValid(tool, col, row);
    this.hoverMarker.setFillStyle(valid ? PALETTE.uiAccent : PALETTE.fishPurple, 0.25);
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

  private isPlacementValid(tool: BuildTool, col: number, row: number): boolean {
    switch (tool.kind) {
      case 'path':
      case 'decor':
        return this.grid.isFree(col, row);
      case 'tank':
        for (let r = row; r < row + tool.size.h; r++) {
          for (let c = col; c < col + tool.size.w; c++) {
            if (!this.grid.isFree(c, r)) return false;
          }
        }
        return true;
      case 'fish':
        return gameState.findTankAt(col, row) !== null;
      case 'erase': {
        const kind = this.grid.get(col, row)?.kind;
        return kind === 'path' || kind === 'tank' || kind === 'decor';
      }
      case 'none':
        return false;
    }
  }

  private applyTool(tool: BuildTool, col: number, row: number): void {
    if (!this.isPlacementValid(tool, col, row)) return;
    switch (tool.kind) {
      case 'path':
        if (!gameState.spend(PATH_COST)) return;
        gameState.addPath({ col, row });
        return;
      case 'decor': {
        const cost = tool.decor === 'plant' ? DECOR_PLANT_COST : DECOR_ROCK_COST;
        if (!gameState.spend(cost)) return;
        gameState.addDecor({ id: crypto.randomUUID(), col, row, kind: tool.decor });
        return;
      }
      case 'tank': {
        const { w, h } = tool.size;
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

  /** Current guest count divided by a size-scaled soft cap. 1.0 = pleasant, >1 = crowded. */
  private crowdFactor(): number {
    const pathCount = gameState.snapshot.paths.length;
    const softCap = Math.max(3, Math.floor(pathCount / 3));
    return this.guests.length / softCap;
  }

  /** Public — UI reads this to show the live demand number. */
  willingnessToPay(): number {
    const crowd = this.crowdFactor();
    const crowdTerm = crowd <= 1 ? crowd * CROWD_SOCIAL_BONUS : CROWD_SOCIAL_BONUS - (crowd - 1) * CROWD_PENALTY_SLOPE;
    return WILLINGNESS_BASE + this.totalAppeal() * APPEAL_WEIGHT + crowdTerm;
  }

  private demand(): number {
    return this.willingnessToPay() - gameState.snapshot.ticketPrice;
  }

  private trySpawnGuest(): void {
    if (this.tanks.length === 0) return;
    if (gameState.snapshot.paths.length === 0) return;

    // Path network guests can walk: the door + every placed path tile.
    const pathTiles = new Set<string>([`${DOOR.col},${DOOR.row}`]);
    for (const p of gameState.snapshot.paths) pathTiles.add(`${p.col},${p.row}`);

    const pathList = [...gameState.snapshot.paths];
    const destination = pathList[Math.floor(Math.random() * pathList.length)];
    if (!destination) return;

    // ENTRANCE (grass outside) → DOOR → path network → destination.
    const toDest = Guest.tilesBetween(ENTRANCE, destination, pathTiles);
    if (toDest.length === 0) return;

    const roundTrip = [...toDest, ...toDest.slice(0, -1).reverse()];
    // Guest pays the current ticket price on entry. Rep bonus below scales with
    // how under-priced the park felt — a squeezed guest doesn't spread the word.
    const priceAtEntry = gameState.snapshot.ticketPrice;
    const demandAtEntry = this.demand();
    gameState.earn(priceAtEntry);
    const unlocked = speciesUnlockedAt(gameState.snapshot.reputation).length;
    const guest = new Guest(this, roundTrip, {
      onView: (_g, c, r) => {
        const tank = this.tanks.find((t) => t.contains(c, r));
        return tank ? tank.appeal : 0;
      },
      onExit: (_g, satisfaction) => {
        const priceBonus = Math.max(0, Math.floor(demandAtEntry / 3));
        const repGain = Math.floor(satisfaction / 2) + priceBonus;
        if (repGain > 0) gameState.addReputation(repGain);
        const unlockedNow = speciesUnlockedAt(gameState.snapshot.reputation).length;
        if (unlockedNow > unlocked) {
          this.cameras.main.flash(200, 115, 239, 247);
        }
      },
    });
    this.guests.push(guest);
  }

  // Kept as a read for any UI element that wants to know the canvas size.
  getViewport(): { w: number; h: number } {
    return { w: GAME_WIDTH, h: GAME_HEIGHT };
  }
}
