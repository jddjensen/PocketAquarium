import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../constants';
import { gameState, type BuildTool } from '../systems/GameState';
import { ALL_SPECIES, speciesUnlockedAt } from '../data/species';
import type { ParkScene } from './ParkScene';

interface ToolButton {
  label: string;
  tool: BuildTool;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * Reference-palette text colors. Keep UI strings using these CSS hex values
 * instead of the numeric PALETTE entries — Phaser text color expects strings.
 */
const UI_TEXT_PRIMARY = '#1d3d2e';
const UI_TEXT_MUTED = '#6b737c';
const UI_TEXT_ACCENT = '#ff6e5b';
const UI_TEXT_GOLD = '#b8860b';
const UI_TEXT_OK = '#1d6b43';

const FONT = { fontFamily: 'monospace', fontSize: '8px', color: UI_TEXT_PRIMARY } as const;

const TOP_BAR_H = 12;
const BOTTOM_BAR_H = 16;

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private priceText!: Phaser.GameObjects.Text;
  private demandText!: Phaser.GameObjects.Text;
  private toolCaption!: Phaser.GameObjects.Text;
  private buttons: ToolButton[] = [];
  private fishPanelOpen = false;
  private fishPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.drawTopBar();
    this.drawBottomBar();
    gameState.subscribe((s) => {
      this.moneyText.setText(`$${s.money}`);
      this.repText.setText(`REP ${s.reputation}`);
      this.priceText.setText(`$${s.ticketPrice}`);
      this.toolCaption.setText(this.labelForTool(s.tool));
      this.toolCaption.setVisible(s.tool.kind !== 'none');
      this.refreshButtons();
    });
  }

  update(): void {
    const park = this.scene.get('ParkScene') as ParkScene | undefined;
    if (!park || typeof park.willingnessToPay !== 'function') return;
    const willingness = park.willingnessToPay();
    const price = gameState.snapshot.ticketPrice;
    const pays = willingness >= price;
    this.demandText.setText(`DEMAND $${willingness.toFixed(1)}`);
    this.demandText.setColor(pays ? UI_TEXT_OK : UI_TEXT_ACCENT);
  }

  /**
   * Cream resource bar: money · rep · ticket price · demand · creatures · save.
   * Sections are visually separated by 1px muted dividers.
   */
  private drawTopBar(): void {
    this.add
      .rectangle(0, 0, GAME_WIDTH, TOP_BAR_H, PALETTE.uiBg, 1)
      .setOrigin(0, 0);
    this.add
      .rectangle(0, TOP_BAR_H - 1, GAME_WIDTH, 1, PALETTE.grassShade, 1)
      .setOrigin(0, 0);

    // Money — gold
    this.moneyText = this.add.text(4, 2, '$0', { ...FONT, color: UI_TEXT_GOLD });
    // Reputation — forest green
    this.repText = this.add.text(44, 2, 'REP 0', { ...FONT, color: UI_TEXT_OK });

    // Divider
    this.add.rectangle(78, 2, 1, TOP_BAR_H - 4, PALETTE.grassShade).setOrigin(0, 0);

    // Price control: [-] $X [+]  — coral dec, forest inc, deep-forest value
    const priceOriginX = 84;
    this.addTextButton(priceOriginX, 2, '-', () => gameState.adjustTicketPrice(-1)).setColor(
      UI_TEXT_ACCENT,
    );
    this.priceText = this.add.text(priceOriginX + 8, 2, '$5', { ...FONT, color: UI_TEXT_PRIMARY });
    this.addTextButton(priceOriginX + 28, 2, '+', () => gameState.adjustTicketPrice(+1)).setColor(
      UI_TEXT_OK,
    );

    this.demandText = this.add.text(priceOriginX + 40, 2, 'DEMAND $0', {
      ...FONT,
      color: UI_TEXT_OK,
    });

    this.addTextButton(GAME_WIDTH - 58, 2, 'CREATURES', () => this.toggleFishPanel()).setColor(
      UI_TEXT_ACCENT,
    );
    this.addTextButton(GAME_WIDTH - 18, 2, 'SAVE', () => gameState.save()).setColor(UI_TEXT_OK);
  }

  /**
   * Cream build bar with category-colored pills. Each pill is a cream rect with
   * a colored left stripe indicating its category (Build = forest, Decor =
   * coral, Erase = muted gray). Active tool shows a darker cream fill.
   */
  private drawBottomBar(): void {
    const barY = GAME_HEIGHT - BOTTOM_BAR_H;
    this.add
      .rectangle(0, barY, GAME_WIDTH, BOTTOM_BAR_H, PALETTE.uiBg, 1)
      .setOrigin(0, 0);
    this.add.rectangle(0, barY, GAME_WIDTH, 1, PALETTE.grassShade, 1).setOrigin(0, 0);

    this.toolCaption = this.add
      .text(4, barY - 10, '', { ...FONT, color: UI_TEXT_PRIMARY })
      .setVisible(false);

    const tools: { label: string; tool: BuildTool; stripe: number }[] = [
      { label: 'none', tool: { kind: 'none' }, stripe: PALETTE.stone },
      { label: 'path', tool: { kind: 'path' }, stripe: PALETTE.sand },
      { label: '2x2', tool: { kind: 'tank', size: { w: 2, h: 2 } }, stripe: PALETTE.grass },
      { label: '3x2', tool: { kind: 'tank', size: { w: 3, h: 2 } }, stripe: PALETTE.grass },
      { label: '4x2', tool: { kind: 'tank', size: { w: 4, h: 2 } }, stripe: PALETTE.grass },
      { label: '3x3', tool: { kind: 'tank', size: { w: 3, h: 3 } }, stripe: PALETTE.grass },
      { label: 'plant', tool: { kind: 'decor', decor: 'plant' }, stripe: PALETTE.plant },
      { label: 'rock', tool: { kind: 'decor', decor: 'rock' }, stripe: PALETTE.stone },
      { label: 'erase', tool: { kind: 'erase' }, stripe: PALETTE.uiAccent },
    ];

    let x = 3;
    for (const entry of tools) {
      const width = entry.label.length * 5 + 8;
      const rect = this.add
        .rectangle(x, barY + 3, width, 10, PALETTE.uiBg, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, PALETTE.grassShade)
        .setInteractive({ useHandCursor: true });
      // Category stripe — 2px colored band on the left edge of each pill
      this.add.rectangle(x, barY + 3, 2, 10, entry.stripe).setOrigin(0, 0);
      const text = this.add.text(x + 4, barY + 5, entry.label, { ...FONT, color: UI_TEXT_PRIMARY });
      rect.on('pointerdown', () => gameState.setTool(entry.tool));
      this.buttons.push({ label: entry.label, tool: entry.tool, rect, text });
      x += width + 2;
    }
  }

  private refreshButtons(): void {
    const current = gameState.snapshot.tool;
    for (const btn of this.buttons) {
      const active = this.toolsEqual(btn.tool, current);
      // Active pill gets a tinted cream fill; inactive stays base cream.
      btn.rect.setFillStyle(active ? PALETTE.sand : PALETTE.uiBg, 1);
      btn.text.setColor(active ? UI_TEXT_PRIMARY : UI_TEXT_MUTED);
    }
  }

  private toolsEqual(a: BuildTool, b: BuildTool): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'tank' && b.kind === 'tank') return a.size.w === b.size.w && a.size.h === b.size.h;
    if (a.kind === 'decor' && b.kind === 'decor') return a.decor === b.decor;
    if (a.kind === 'fish' && b.kind === 'fish') return a.speciesId === b.speciesId;
    return true;
  }

  private labelForTool(t: BuildTool): string {
    switch (t.kind) {
      case 'none':
        return '';
      case 'path':
        return 'path  $5';
      case 'tank':
        return `habitat ${t.size.w}x${t.size.h}  $${50 * t.size.w * t.size.h}`;
      case 'decor':
        return `${t.decor}  $${t.decor === 'plant' ? 15 : 10}`;
      case 'fish': {
        const species = ALL_SPECIES.find((s) => s.id === t.speciesId);
        return species ? `stock ${species.name}  $${species.price}` : 'stock creature';
      }
      case 'erase':
        return 'erase (+$2)';
    }
  }

  /**
   * Creature picker panel — cream card with coral border. Entries are
   * clickable rows showing price/appeal/rarity, greyed-out if locked.
   */
  private toggleFishPanel(): void {
    this.fishPanelOpen = !this.fishPanelOpen;
    if (this.fishPanel) {
      this.fishPanel.destroy();
      this.fishPanel = null;
    }
    if (!this.fishPanelOpen) return;

    const panel = this.add.container(0, 0);
    const panelX = 30;
    const panelY = TOP_BAR_H + 4;
    const panelW = GAME_WIDTH - 60;
    const panelH = GAME_HEIGHT - TOP_BAR_H - BOTTOM_BAR_H - 8;

    // Shadow
    panel.add(
      this.add
        .rectangle(panelX + 2, panelY + 2, panelW, panelH, PALETTE.plantShadow, 0.3)
        .setOrigin(0, 0),
    );
    const bg = this.add
      .rectangle(panelX, panelY, panelW, panelH, PALETTE.uiBg, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PALETTE.uiAccent);
    panel.add(bg);

    // Header stripe
    panel.add(
      this.add.rectangle(panelX, panelY, panelW, 9, PALETTE.uiAccent, 1).setOrigin(0, 0),
    );
    panel.add(
      this.add.text(panelX + 4, panelY + 1, 'CREATURES', {
        ...FONT,
        color: '#ffffff',
      }),
    );
    panel.add(
      this.add.text(panelX + 58, panelY + 1, 'click to select, then click a habitat', {
        ...FONT,
        color: '#ffffff',
      }),
    );

    const unlocked = speciesUnlockedAt(gameState.snapshot.reputation);
    let row = 0;
    for (const species of ALL_SPECIES) {
      const y = panelY + 12 + row * 11;
      const isUnlocked = unlocked.includes(species);
      const caught = gameState.snapshot.caught.has(species.id);
      const color = isUnlocked ? (caught ? UI_TEXT_GOLD : UI_TEXT_PRIMARY) : UI_TEXT_MUTED;
      const label = isUnlocked
        ? `${species.name}  $${species.price}  ★${species.appeal}  (${species.rarity})`
        : `??? — unlock at REP ${species.unlockReputation}`;
      const text = this.add.text(panelX + 4, y, label, { ...FONT, color });
      panel.add(text);
      if (isUnlocked) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerdown', () => {
          gameState.setTool({ kind: 'fish', speciesId: species.id });
          this.toggleFishPanel();
        });
      }
      row++;
    }

    const close = this.add.text(panelX + panelW - 24, panelY + 1, '[close]', {
      ...FONT,
      color: '#ffffff',
    });
    close.setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.toggleFishPanel());
    panel.add(close);

    this.fishPanel = panel;
  }

  private addTextButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, label, FONT);
    t.setInteractive({ useHandCursor: true });
    t.on('pointerdown', onClick);
    return t;
  }
}
