import type { TileKind } from '../world/Grid';
import type { DecorKind } from '../data/decor';
import {
  DEFAULT_TICKET_PRICE,
  MAX_TICKET_PRICE,
  MIN_TICKET_PRICE,
} from '../constants';

const SAVE_KEY = 'pocket-aquarium:save:v2';
const LEGACY_SAVE_KEY_V1 = 'pocket-aquarium:save:v1';

export interface PlacedTank {
  id: string;
  col: number;
  row: number;
  w: number;
  h: number;
  fishSpeciesIds: string[];
}

export interface PlacedDecor {
  id: string;
  col: number;
  row: number;
  kind: DecorKind;
}

export interface PlacedPath {
  col: number;
  row: number;
}

export interface SaveDataV1 {
  version: 1;
  money: number;
  reputation: number;
  tanks: PlacedTank[];
  decor: PlacedDecor[];
  paths: PlacedPath[];
  caught: string[];
}

export interface SaveData {
  version: 2;
  money: number;
  reputation: number;
  tanks: PlacedTank[];
  decor: PlacedDecor[];
  paths: PlacedPath[];
  caught: string[];
  ticketPrice: number;
}

export type BuildTool =
  | { kind: 'none' }
  | { kind: 'path' }
  | { kind: 'tank'; size: { w: number; h: number } }
  | { kind: 'decor'; decor: DecorKind }
  | { kind: 'fish'; speciesId: string }
  | { kind: 'erase' };

export interface GameStateData {
  money: number;
  reputation: number;
  tanks: PlacedTank[];
  decor: PlacedDecor[];
  paths: PlacedPath[];
  caught: Set<string>;
  tool: BuildTool;
  ticketPrice: number;
}

type Listener = (state: GameStateData) => void;

export class GameState {
  private data: GameStateData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = this.load() ?? this.defaultState();
  }

  get snapshot(): GameStateData {
    return this.data;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.data);
    return () => this.listeners.delete(fn);
  }

  setTool(tool: BuildTool): void {
    this.data.tool = tool;
    this.emit();
  }

  setTicketPrice(price: number): void {
    this.data.ticketPrice = Math.max(MIN_TICKET_PRICE, Math.min(MAX_TICKET_PRICE, Math.round(price)));
    this.emit();
  }

  adjustTicketPrice(delta: number): void {
    this.setTicketPrice(this.data.ticketPrice + delta);
  }

  spend(amount: number): boolean {
    if (this.data.money < amount) return false;
    this.data.money -= amount;
    this.emit();
    return true;
  }

  earn(amount: number): void {
    this.data.money += amount;
    this.emit();
  }

  addReputation(amount: number): void {
    this.data.reputation = Math.max(0, this.data.reputation + amount);
    this.emit();
  }

  recordCatch(speciesId: string): void {
    if (!this.data.caught.has(speciesId)) {
      this.data.caught.add(speciesId);
      this.emit();
    }
  }

  addTank(tank: PlacedTank): void {
    this.data.tanks.push(tank);
    this.emit();
  }

  addDecor(decor: PlacedDecor): void {
    this.data.decor.push(decor);
    this.emit();
  }

  addPath(path: PlacedPath): void {
    this.data.paths.push(path);
    this.emit();
  }

  removeAt(col: number, row: number): TileKind | null {
    const tankIdx = this.data.tanks.findIndex(
      (t) => col >= t.col && col < t.col + t.w && row >= t.row && row < t.row + t.h,
    );
    if (tankIdx >= 0) {
      this.data.tanks.splice(tankIdx, 1);
      this.emit();
      return 'tank';
    }
    const decorIdx = this.data.decor.findIndex((d) => d.col === col && d.row === row);
    if (decorIdx >= 0) {
      this.data.decor.splice(decorIdx, 1);
      this.emit();
      return 'decor';
    }
    const pathIdx = this.data.paths.findIndex((p) => p.col === col && p.row === row);
    if (pathIdx >= 0) {
      this.data.paths.splice(pathIdx, 1);
      this.emit();
      return 'path';
    }
    return null;
  }

  findTankAt(col: number, row: number): PlacedTank | null {
    return (
      this.data.tanks.find(
        (t) => col >= t.col && col < t.col + t.w && row >= t.row && row < t.row + t.h,
      ) ?? null
    );
  }

  save(): void {
    const serial: SaveData = {
      version: 2,
      money: this.data.money,
      reputation: this.data.reputation,
      tanks: this.data.tanks,
      decor: this.data.decor,
      paths: this.data.paths,
      caught: [...this.data.caught],
      ticketPrice: this.data.ticketPrice,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(serial));
    } catch {
      /* storage unavailable — silent */
    }
  }

  reset(): void {
    this.data = this.defaultState();
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY_V1);
    } catch {
      /* noop */
    }
    this.emit();
  }

  private load(): GameStateData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        if (parsed.version === 2) {
          return {
            money: parsed.money,
            reputation: parsed.reputation,
            tanks: parsed.tanks,
            decor: parsed.decor,
            paths: parsed.paths,
            caught: new Set(parsed.caught),
            tool: { kind: 'none' },
            ticketPrice: parsed.ticketPrice,
          };
        }
      }
      const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY_V1);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as SaveDataV1;
        if (legacy.version === 1) {
          return {
            money: legacy.money,
            reputation: legacy.reputation,
            tanks: legacy.tanks,
            decor: legacy.decor,
            paths: legacy.paths,
            caught: new Set(legacy.caught),
            tool: { kind: 'none' },
            ticketPrice: DEFAULT_TICKET_PRICE,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private defaultState(): GameStateData {
    return {
      money: 500,
      reputation: 0,
      tanks: [],
      decor: [],
      paths: [],
      caught: new Set(),
      tool: { kind: 'none' },
      ticketPrice: DEFAULT_TICKET_PRICE,
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.data);
  }
}

export const gameState = new GameState();
