import Phaser from 'phaser';
import {
  DOOR,
  ENTRANCE,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_COLS,
  GRID_ROWS,
  ISO_TILE_H,
  ISO_TILE_W,
  PALETTE,
  WAREHOUSE,
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
  private hoverMarker!: Phaser.GameObjects.Polygon;
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
      .polygon(0, 0, this.isoDiamondPoints(1, 1), PALETTE.uiAccent, 0.25)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PALETTE.uiAccent)
      .setDepth(10_000)
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
   * Iso backdrop. Floor tiles are drawn first (low depth), then walls painted
   * back-to-front by `col + row` so taller wall sprites correctly occlude
   * anything behind them. Only back walls (north + west perimeter) are drawn —
   * the south/east sides remain blocking for placement but render as floor so
   * the player can see into the building.
   */
  private drawBackdrop(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.grid.get(c, r);
        if (!tile) continue;
        const { x, y } = Grid.tileToWorld(c, r);
        const isBackWall = tile.kind === 'wall' && this.isBackWall(c, r);
        const isBackDoor = tile.kind === 'door' && this.isBackWall(c, r);

        // Always lay a ground tile under everything for clean seams.
        const groundKey =
          tile.kind === 'exterior'
            ? 'tile-grass'
            : tile.kind === 'wall' || tile.kind === 'door' || tile.kind === 'floor'
              ? 'tile-floor'
              : 'tile-floor';
        this.add.image(x, y, groundKey).setOrigin(0.5, 0.5).setDepth(Grid.tileDepth(c, r) - 1000);

        if (isBackWall || isBackDoor) {
          const key = isBackDoor ? 'tile-door' : 'tile-wall';
          this.add
            .image(x, y + ISO_TILE_H / 2, key)
            .setOrigin(0.5, 1)
            .setDepth(Grid.tileDepth(c, r));
        }
      }
    }

    // Welcome path marker on the iso grass just outside the door.
    const spawnWorld = Grid.tileToWorld(ENTRANCE.col, ENTRANCE.row);
    this.add
      .polygon(
        spawnWorld.x,
        spawnWorld.y,
        this.isoDiamondPoints(1, 1),
        PALETTE.path,
        0.5,
      )
      .setOrigin(0, 0)
      .setDepth(Grid.tileDepth(ENTRANCE.col, ENTRANCE.row) - 500);
  }

  /** A warehouse perimeter cell is a "back" wall if it's on the north or west side. */
  private isBackWall(col: number, row: number): boolean {
    return col === WAREHOUSE.col || row === WAREHOUSE.row;
  }

  /**
   * Vertex list for a diamond covering an N×M tile footprint, suitable for a
   * Phaser.Polygon. Returned in local coords around (0,0) = rhombus top vertex.
   */
  private isoDiamondPoints(cols: number, rows: number): number[] {
    const tw = ISO_TILE_W / 2;
    const th = ISO_TILE_H / 2;
    // Top, right, bottom, left vertices around the rhombus.
    return [
      cols * tw, 0,
      (cols + rows) * tw, rows * th,
      rows * tw, (cols + rows) * th,
      0, cols * th,
    ];
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
      const { x, y } = Grid.tileToWorld(p.col, p.row);
      const tile = this.add
        .image(x, y, 'tile-path')
        .setOrigin(0.5, 0.5)
        .setDepth(Grid.tileDepth(p.col, p.row) - 500);
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
    // The hover diamond is anchored at the top vertex of its footprint's
    // rhombus, so its anchor is the iso projection of (col, row) shifted up
    // by half a tile height (the diamond top vertex sits above the tile center).
    const { x, y } = Grid.tileToWorld(col, row);
    this.hoverMarker.setPosition(x, y - ISO_TILE_H / 2);
    const valid = this.isPlacementValid(tool, col, row);
    this.hoverMarker.setFillStyle(valid ? PALETTE.uiAccent : PALETTE.fishPurple, 0.25);
    const footprint = tool.kind === 'tank' ? tool.size : { w: 1, h: 1 };
    this.hoverMarker.setTo(this.isoDiamondPoints(footprint.w, footprint.h));
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
