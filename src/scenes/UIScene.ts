import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../constants';
import { gameState, type BuildTool } from '../systems/GameState';
import { ALL_SPECIES, speciesUnlockedAt } from '../data/species';

interface ToolButton {
  label: string;
  tool: BuildTool;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

const FONT = { fontFamily: 'monospace', fontSize: '8px', color: '#f4f4f4' } as const;

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private toolText!: Phaser.GameObjects.Text;
  private buttons: ToolButton[] = [];
  private fishPanelOpen = false;
  private fishPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.drawHudBar();
    this.drawBuildBar();
    gameState.subscribe((s) => {
      this.moneyText.setText(`$${s.money}`);
      this.repText.setText(`REP ${s.reputation}`);
      this.toolText.setText(this.labelForTool(s.tool));
      this.refreshButtons();
    });
  }

  private drawHudBar(): void {
    const bar = this.add.rectangle(0, 0, GAME_WIDTH, 10, PALETTE.uiBg, 0.9).setOrigin(0, 0);
    bar.setStrokeStyle(1, PALETTE.stoneShadow);
    this.moneyText = this.add.text(3, 1, '$0', { ...FONT, color: '#ffcd75' });
    this.repText = this.add.text(40, 1, 'REP 0', { ...FONT, color: '#73eff7' });
    this.toolText = this.add.text(90, 1, 'Tool: none', FONT);

    this.addTextButton(GAME_WIDTH - 56, 1, 'FISH', () => this.toggleFishPanel()).setColor('#94b0c2');
    this.addTextButton(GAME_WIDTH - 28, 1, 'SAVE', () => gameState.save()).setColor('#38b764');
  }

  private drawBuildBar(): void {
    const barY = GAME_HEIGHT - 16;
    this.add.rectangle(0, barY, GAME_WIDTH, 16, PALETTE.uiBg, 0.9).setOrigin(0, 0).setStrokeStyle(1, PALETTE.stoneShadow);

    const tools: { label: string; tool: BuildTool }[] = [
      { label: 'none', tool: { kind: 'none' } },
      { label: 'path', tool: { kind: 'path' } },
      { label: '2x2', tool: { kind: 'tank', size: { w: 2, h: 2 } } },
      { label: '3x2', tool: { kind: 'tank', size: { w: 3, h: 2 } } },
      { label: '4x2', tool: { kind: 'tank', size: { w: 4, h: 2 } } },
      { label: '3x3', tool: { kind: 'tank', size: { w: 3, h: 3 } } },
      { label: 'plant', tool: { kind: 'decor', decor: 'plant' } },
      { label: 'rock', tool: { kind: 'decor', decor: 'rock' } },
      { label: 'erase', tool: { kind: 'erase' } },
    ];

    let x = 3;
    for (const entry of tools) {
      const width = entry.label.length * 5 + 6;
      const rect = this.add
        .rectangle(x, barY + 3, width, 10, PALETTE.stoneShadow)
        .setOrigin(0, 0)
        .setStrokeStyle(1, PALETTE.stone)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x + 3, barY + 5, entry.label, FONT);
      rect.on('pointerdown', () => gameState.setTool(entry.tool));
      this.buttons.push({ label: entry.label, tool: entry.tool, rect, text });
      x += width + 2;
    }
  }

  private refreshButtons(): void {
    const current = gameState.snapshot.tool;
    for (const btn of this.buttons) {
      const active = this.toolsEqual(btn.tool, current);
      btn.rect.setFillStyle(active ? PALETTE.waterLight : PALETTE.stoneShadow);
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
        return 'Tool: none';
      case 'path':
        return 'Tool: path $5';
      case 'tank':
        return `Tool: tank ${t.size.w}x${t.size.h} $${50 * t.size.w * t.size.h}`;
      case 'decor':
        return `Tool: ${t.decor}`;
      case 'fish': {
        const species = ALL_SPECIES.find((s) => s.id === t.speciesId);
        return species ? `Tool: stock ${species.name} $${species.price}` : 'Tool: stock fish';
      }
      case 'erase':
        return 'Tool: erase';
    }
  }

  private toggleFishPanel(): void {
    this.fishPanelOpen = !this.fishPanelOpen;
    if (this.fishPanel) {
      this.fishPanel.destroy();
      this.fishPanel = null;
    }
    if (!this.fishPanelOpen) return;

    const panel = this.add.container(0, 0);
    const bg = this.add
      .rectangle(40, 14, GAME_WIDTH - 80, GAME_HEIGHT - 34, PALETTE.uiBg, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PALETTE.uiAccent);
    panel.add(bg);
    panel.add(this.add.text(44, 17, 'FISH — click to select, click a tank to stock', FONT));

    const unlocked = speciesUnlockedAt(gameState.snapshot.reputation);
    let row = 0;
    for (const species of ALL_SPECIES) {
      const y = 30 + row * 12;
      const isUnlocked = unlocked.includes(species);
      const caught = gameState.snapshot.caught.has(species.id);
      const color = isUnlocked ? (caught ? '#ffcd75' : '#f4f4f4') : '#566c86';
      const label = isUnlocked
        ? `${species.name}  $${species.price}  ★${species.appeal}  (${species.rarity})`
        : `??? — unlock at REP ${species.unlockReputation}`;
      const text = this.add.text(46, y, label, { ...FONT, color });
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

    const close = this.add.text(GAME_WIDTH - 50, 17, '[close]', { ...FONT, color: '#73eff7' });
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
